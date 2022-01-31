import React from 'react';
import { Container, Header, Loader, Button, Segment, Card } from 'semantic-ui-react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
// import { Accounts } from 'meteor/accounts-base';
import { PendingUsers } from '../../api/PendingUserCollection';
import { removeItMethod } from '../../api/base/BaseCollection.methods';
import { acceptMethod } from '../../api/ManageUser.methods';
// import { PAGE_IDS } from '../utilities/PageIDs';

// TODO: assign roles dropdown

const acceptUser = (user) => {
  acceptMethod.callPromise(user)
    .then(() => {
      // TODO: remove user from PendingUsers
      swal('Success', `${user.email} accepted successfully`, 'success', { buttons: false, timer: 3000 });
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
          .catch(error => swal('Error', error.message, 'error'))
          .then(() => {
            swal('Success', `${email} rejected successfully`, 'success', { buttons: false, timer: 3000 });
          });
      }
    });
};

/** Renders a table containing all of the Stuff documents. Use <StuffItem> to render each row. */
const ManageNewUsers = ({ ready, users }) => ((ready) ? (
  <Container id='manage-new-users'>
    <Header as="h2" textAlign="center">Manage New Users</Header>
    <Segment>
      <Card.Group>
        {
          users.map(user =>
            <Card fluid key={user._id}>
              <Card.Content>
                <Card.Header>{`${user.firstName} ${user.lastName}`}</Card.Header>
                <Card.Meta>{`Email: ${user.email}`}</Card.Meta>
                <Card.Description>{`${user.firstName} wants to register.`}</Card.Description>
                <div className='user-controls'>
                  <Button className='accept-button' compact onClick={() => acceptUser(user)}>Accept</Button>
                  <Button className='reject-button' compact onClick={() => rejectUser(user.email, user._id)}>Reject</Button>
                </div>
              </Card.Content>
            </Card>
          )
        }
      </Card.Group>
    </Segment>
  </Container>
) : <Loader active>Getting data</Loader>);

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
  const users = PendingUsers.find({}, { sort: { lastName: 1 } }).fetch();
  return {
    users,
    ready,
  };
})(ManageNewUsers);
