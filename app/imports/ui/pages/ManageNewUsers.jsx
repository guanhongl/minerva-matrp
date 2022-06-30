import React, { useState, useEffect } from 'react';
import { Container, Header, Loader, Segment, Input, Table, Icon } from 'semantic-ui-react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import swal from 'sweetalert';
import moment from 'moment';
import { ZipZap } from 'meteor/udondan:zipzap';
import { PendingUsers } from '../../api/pending-user/PendingUserCollection';
import { removeItMethod } from '../../api/base/BaseCollection.methods';
import { acceptMethod, generateAuthUrlMethod, generateRefreshTokenMethod, uploadUserMethod } from '../../api/ManageUser.methods';
import { readCSVMethod } from '../../api/ManageDatabase.methods';
// import { PAGE_IDS } from '../utilities/PageIDs';

const acceptUser = (user) => {
  acceptMethod.callPromise({ user })
    .then(() => swal('Success', `${user.email} accepted successfully`, 'success', { buttons: false, timer: 3000 }))
    .catch(error => swal('Error', error.error, 'error'));
};

const rejectUser = ({ email, _id }) => {
  swal({
    title: 'Are you sure?',
    text: `Do you really want to reject ${email}?`,
    icon: 'warning',
    buttons: [
      'No, cancel it!',
      'Yes, I am sure!',
    ],
    dangerMode: true,
  })
    .then((isConfirm) => {
      // if 'yes'
      if (isConfirm) {
        const collectionName = PendingUsers.getCollectionName();

        removeItMethod.callPromise({ collectionName, instance: _id })
          .then(() => {
            swal('Success', `${email} rejected successfully`, 'success', { buttons: false, timer: 3000 });
          })
          .catch(error => swal('Error', error.error, 'error'));
      }
    });
};

// const generateAuthUrl = () => {
//   generateAuthUrlMethod.callPromise()
//     .then(url => {
//       // GET
//       console.log(`Browse to the following URL: ${url}`)
//     })
//     .catch(error => swal('Error', error.error, 'error'));
// };

// const generateRefreshToken = () => {
//   generateRefreshTokenMethod.callPromise()
//     .then()
//     .catch(error => swal('Error', error.error, 'error'));
// };

/** Renders ManageNewUsers */
const ManageNewUsers = ({ ready, users }) => {
  const [userFilter, setUserFilter] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [fileData, setFileData] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFilteredUsers(users);
  }, [users]);

  const handleFilter = (event, { value }) => {
    setUserFilter(value);
    const query = value.toLowerCase();
    const filter = users.filter(({ firstName, lastName }) => {
      if (value) {
        return firstName.toLowerCase().includes(query) || lastName.toLowerCase().includes(query);
      } 
      return true;
    });
    setFilteredUsers(filter);
  };

  const readFile = (e) => {
    const files = e.target.files;
    // eslint-disable-next-line no-undef
    const reader = new FileReader();
    reader.readAsText(files[0]);
    reader.onload = (event) => {
      if (files[0].type === 'text/csv') {
        setFileData(event.target.result);
      } else {
        setFileData('');
        swal('Error', 'Invalid file format. Only files with the extension csv are allowed', 'error');
      }
    };
  };

  const upload = () => {
    setLoading(true);
    uploadUserMethod.callPromise({ data: fileData })
      .then(count => swal('Success', `${count} users defined successfully.`, 'success', { buttons: false, timer: 3000 }))
      .catch(error => swal("Error", error.message, "error"))
      .finally(() => setLoading(false));
  };

  const download = () => {
    const db = "user";
    readCSVMethod.callPromise({ db })
      .then(csv => {
        const zip = new ZipZap();
        zip.file(`${db}_template.csv`, csv);
        zip.saveAs(`${db}_template.zip`);
      })
      .catch(error => swal("Error", error.message, "error"));
  };

  return (
    (ready) ? (
      <Container id='manage-new-users'>
        <Segment.Group>
          <Segment className='manage-user-header'>
            <Header as="h2">Manage New Users</Header>
            <Input placeholder='Search users...' value={userFilter} onChange={handleFilter} />
          </Segment>
          <Segment>
            <div className='csv-segment'>
                <div>
                  <Input type="file" onChange={readFile} />
                  {
                    loading ? 
                      <Loader inline active />
                      :
                      <span onClick={upload}>
                        <Icon name="upload" />
                        Upload
                        <Icon name="file excel" />
                      </span>
                  }
                </div>
                <span onClick={download}>
                  <Icon name="download" />
                  Download template
                  <Icon name="file excel" />
                </span>
            </div>
          </Segment>
          <Segment>
            <Table basic='very' columns={4} unstackable>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Date added</Table.HeaderCell>
                  <Table.HeaderCell>Name</Table.HeaderCell>
                  <Table.HeaderCell>Email</Table.HeaderCell>
                  <Table.HeaderCell />
                </Table.Row>
              </Table.Header>
              <Table.Body>
              {
                filteredUsers.length ? 
                  filteredUsers.map(user => 
                    <Table.Row key={user._id}>
                      <Table.Cell>{moment(user.createdAt).format('MMM D YYYY, hh:mm:ss a')}</Table.Cell>
                      <Table.Cell>{`${user.lastName}, ${user.firstName}`}</Table.Cell>
                      <Table.Cell>{user.email}</Table.Cell>
                      <Table.Cell>
                        <div className='user-controls'>
                          <span onClick={() => acceptUser(user)}>Accept</span>
                          <span onClick={() => rejectUser(user)}>Reject</span>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )
                  :
                  <Table.Row>
                    <Table.Cell as='td' colSpan='4' textAlign='center' content={'No users to display.'} />
                  </Table.Row>
              }
              </Table.Body>
            </Table>
          </Segment>
          {/* <Segment>
            <span onClick={generateAuthUrl}>Get auth code</span>
            <span onClick={generateRefreshToken}>Get refresh token</span>
          </Segment> */}
        </Segment.Group>
      </Container>
    ) : <Loader active>Getting data</Loader>
  );
};

// Require an array of users in the props.
ManageNewUsers.propTypes = {
  users: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
};

// withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker
export default withTracker(() => {
  // Get access to documents.
  const subscription = PendingUsers.subscribePendingUser();
  // Determine if the subscription is ready
  const ready = subscription.ready();
  // Get the documents and sort them by name.
  const users = PendingUsers.find({}, { sort: { createdAt: -1 } }).fetch();
  return {
    users,
    ready,
  };
})(ManageNewUsers);
