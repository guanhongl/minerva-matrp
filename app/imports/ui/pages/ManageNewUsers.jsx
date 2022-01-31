import React from 'react';
import { Container, Table, Header, Loader, Button } from 'semantic-ui-react';
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
  <Container>
    <Header as="h2" textAlign="center">Manage New Users</Header>
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>First Name</Table.HeaderCell>
          <Table.HeaderCell>Last Name</Table.HeaderCell>
          <Table.HeaderCell>Email</Table.HeaderCell>
          <Table.HeaderCell>Edit</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {/* {stuffs.map((stuff) => <StuffItem key={stuff._id} stuff={stuff} />)} */}
        {
          users.map(user =>
            <Table.Row key={user._id}>
              <Table.Cell>{user.firstName}</Table.Cell>
              <Table.Cell>{user.lastName}</Table.Cell>
              <Table.Cell>{user.email}</Table.Cell>
              <Table.Cell>
                <Button positive onClick={() => acceptUser(user)}>Accept</Button>
                <Button negative onClick={() => rejectUser(user.email, user._id)}>Reject</Button>
              </Table.Cell>
            </Table.Row>
          )
        }
      </Table.Body>
    </Table>
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
