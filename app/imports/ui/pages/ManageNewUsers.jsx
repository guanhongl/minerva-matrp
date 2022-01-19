import React from 'react';
import { Container, Table, Header, Loader, Button } from 'semantic-ui-react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { PendingUsers } from '../../api/PendingUserCollection';
// import { PAGE_IDS } from '../utilities/PageIDs';

/** Renders a table containing all of the Stuff documents. Use <StuffItem> to render each row. */
const ManageNewUsers = ({ ready, users }) => ((ready) ? (
  <Container>
    <Header as="h2" textAlign="center">New Users</Header>
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
                <Button positive>Accept</Button>
                <Button negative>Reject</Button>
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
