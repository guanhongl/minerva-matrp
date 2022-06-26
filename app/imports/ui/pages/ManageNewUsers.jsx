import React, { useState, useEffect } from 'react';
import { Container, Header, Loader, Segment, Input, Table } from 'semantic-ui-react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import swal from 'sweetalert';
import moment from 'moment';
import { PendingUsers } from '../../api/pending-user/PendingUserCollection';
import { removeItMethod } from '../../api/base/BaseCollection.methods';
import { acceptMethod, generateAuthUrlMethod, generateRefreshTokenMethod } from '../../api/ManageUser.methods';
// import { PAGE_IDS } from '../utilities/PageIDs';

const acceptUser = (user) => {
  acceptMethod.callPromise(user)
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

/** Renders a table containing all of the Stuff documents. Use <StuffItem> to render each row. */
const ManageNewUsers = ({ ready, users }) => {
  const [userFilter, setUserFilter] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

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

  return (
    (ready) ? (
      <Container id='manage-new-users'>
        <Segment.Group>
          <Segment className='manage-user-header'>
            <Header as="h2">Manage New Users</Header>
            <Input placeholder='Search users...' value={userFilter} onChange={handleFilter} />
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
            {/* <Card.Group>
              {
                users.filter(({ firstName, lastName }) => firstName.concat(' ', lastName).toLowerCase().includes(userFilter.toLowerCase()))
                  .map(user => <Card fluid key={user._id}>
                    <Card.Content>
                      <Card.Header>{`${user.firstName} ${user.lastName}`}</Card.Header>
                      <Card.Meta>{`Email: ${user.email}`}</Card.Meta>
                      <Card.Description>{`${user.firstName} wants to register.`}</Card.Description>
                      <div className='user-controls'>
                        <Button className='accept-button' compact onClick={() => acceptUser(user)}>Accept</Button>
                        <Button className='reject-button' compact onClick={() => rejectUser(user.email, user._id)}>Reject</Button>
                      </div>
                    </Card.Content>
                  </Card>)
              }
            </Card.Group> */}
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

// Require an array of Stuff documents in the props.
ManageNewUsers.propTypes = {
  users: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
};

// withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker
export default withTracker(() => {
  // Get access to Stuff documents.
  const subscription = PendingUsers.subscribePendingUser();
  // Determine if the subscription is ready
  const ready = subscription.ready();
  // Get the Stuff documents and sort them by name.
  const users = PendingUsers.find({}, { sort: { createdAt: -1 } }).fetch();
  return {
    users,
    ready,
  };
})(ManageNewUsers);
