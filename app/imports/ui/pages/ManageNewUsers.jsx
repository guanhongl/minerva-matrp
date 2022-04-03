import React, { useState } from 'react';
import { Container, Header, Loader, Button, Segment, Card, Input } from 'semantic-ui-react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import swal from 'sweetalert';
// import { Accounts } from 'meteor/accounts-base';
import { PendingUsers } from '../../api/PendingUserCollection';
import { removeItMethod } from '../../api/base/BaseCollection.methods';
import { acceptMethod } from '../../api/ManageUser.methods';
// import { PAGE_IDS } from '../utilities/PageIDs';

// TODO: assign roles dropdown?

const acceptUser = (user) => {
  acceptMethod.callPromise(user)
    .then(() => {
      swal('Success', `${user.email} accepted successfully`, 'success', { buttons: false, timer: 3000 });

      // const collectionName = PendingUsers.getCollectionName();
      // removeItMethod.callPromise({ collectionName, instance: user._id }) // assume delete works
      //   .then(response => console.log(response));
    })
    .catch(error => swal('Error', error.message, 'error'));
};

const rejectUser = (email, id) => {
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

        removeItMethod.callPromise({ collectionName, instance: id })
          .then(() => {
            swal('Success', `${email} rejected successfully`, 'success', { buttons: false, timer: 3000 });
          })
          .catch(error => swal('Error', error.message, 'error'));
      }
    });
};

/** Renders a table containing all of the Stuff documents. Use <StuffItem> to render each row. */
const ManageNewUsers = ({ ready, users }) => {
  const [userFilter, setUserFilter] = useState('');

  return (
    (ready) ? (
      <Container id='manage-new-users'>
        <Segment.Group>
          <Segment className='manage-user-header'>
            <Header as="h2">Manage New Users</Header>
            <Input placeholder='Search users...' value={userFilter} onChange={(event, { value }) => setUserFilter(value)} />
          </Segment>
          <Segment>
            <Card.Group>
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
            </Card.Group>
          </Segment>
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
