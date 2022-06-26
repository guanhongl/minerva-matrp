import { Meteor } from 'meteor/meteor';
import React, { useState, useEffect } from 'react';
import { Container, Header, Loader, Icon, Segment, Input, Dropdown, Table } from 'semantic-ui-react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import swal from 'sweetalert';
import { UserProfiles } from '../../api/user/UserProfileCollection';
import { SuperUserProfiles } from '../../api/user/SuperUserProfileCollection';
import { AdminProfiles } from '../../api/user/AdminProfileCollection';
import { removeMethod, updateRoleMethod } from '../../api/ManageUser.methods';
// import { PAGE_IDS } from '../utilities/PageIDs';

const rolesToCollectionNames = {
  USER: UserProfiles.getCollectionName(),
  SUPERUSER: SuperUserProfiles.getCollectionName(),
  ADMIN: AdminProfiles.getCollectionName(),
};

const updateRole = (user, newRole) => {
  const prev = rolesToCollectionNames[user.role];
  const collectionName = rolesToCollectionNames[newRole];

  updateRoleMethod.callPromise({ prev, collectionName, user, newRole })
    .then(() => swal('Success', `${user.email} updated successfully`, 'success', { buttons: false, timer: 3000 }))
    .catch(error => swal('Error', error.error, 'error'));
};

const deleteUser = ({ userID, _id: profileID, role, email }) => {
  swal({
    title: 'Are you sure?',
    text: `Do you really want to delete ${email}?`,
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
        const collectionName = rolesToCollectionNames[role];
        removeMethod.callPromise({ collectionName, userID, profileID })
          .then(() => swal('Success', `${email} deleted successfully`, 'success', { buttons: false, timer: 3000 }))
          .catch(error => swal('Error', error.error, 'error'));
      }
    });
};

/** Renders a table containing all of the Stuff documents. Use <StuffItem> to render each row. */
const ManageUsers = ({ ready, userList, roles, waitlist }) => {
  const [userFilter, setUserFilter] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(userList);

  useEffect(() => {
    setFilteredUsers(userList)
  }, [userList]);

  const handleFilter = (event, { value }) => {
    setUserFilter(value);
    const query = value.toLowerCase();
    const filter = userList.filter(({ firstName, lastName }) => {
      if (value) {
        return firstName.toLowerCase().includes(query) || lastName.toLowerCase().includes(query);
      } 
      return true;
    });
    setFilteredUsers(filter);
  };

  return (
    (ready) ? (
      <Container id='manage-users'>
        <Segment.Group>
          <Segment className='manage-user-header'>
            <Header as="h2">Manage Users</Header>
            <Input placeholder='Search users...' value={userFilter} onChange={handleFilter} />
          </Segment>
          <Segment>
            <Table basic='very' columns={5} unstackable>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Name</Table.HeaderCell>
                  <Table.HeaderCell>Email</Table.HeaderCell>
                  <Table.HeaderCell>Role</Table.HeaderCell>
                  <Table.HeaderCell>Note</Table.HeaderCell>
                  <Table.HeaderCell />
                </Table.Row>
              </Table.Header>
              <Table.Body>
              {
                filteredUsers.length ? 
                  filteredUsers.map(user => 
                    <Table.Row key={user._id}>
                      <Table.Cell>{`${user.lastName}, ${user.firstName}`}</Table.Cell>
                      <Table.Cell>{user.email}</Table.Cell>
                      <Table.Cell>
                        <Dropdown
                          inline
                          options={roles}
                          value={user.role}
                          onChange={(event, { value }) => updateRole(user, value)}
                        />
                      </Table.Cell>
                      <Table.Cell>{waitlist.find(o => o._id === user.userID)?.services?.resume ? "" : "Waiting for response..."}</Table.Cell>
                      <Table.Cell textAlign='right'>
                        <span className='delete-user' onClick={() => deleteUser(user)}>
                          <Icon name='trash alternate' />
                          Delete User
                        </span>
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
                userList.filter(({ firstName, lastName }) => firstName.concat(' ', lastName).toLowerCase().includes(userFilter.toLowerCase()))
                  .map(user => <Card fluid key={user._id}>
                    <Card.Content>
                      <Card.Header>{`${user.lastName}, ${user.firstName}`}</Card.Header>
                      <Card.Meta>{`Email: ${user.email}`}</Card.Meta>
                      <Card.Description>
                        <label>{'Role: '}</label>
                        <Dropdown
                          inline
                          options={roles}
                          value={user.role}
                          onChange={(event, { value }) => updateRole(user, value)}
                        />
                        <span className='delete-user' onClick={() => deleteUser(user)}>
                          <Icon name='trash alternate' />
                          Delete User
                        </span>
                      </Card.Description>
                    </Card.Content>
                  </Card>)
              }
            </Card.Group> */}
          </Segment>
        </Segment.Group>
      </Container>
    ) : <Loader active>Getting data</Loader>
  );
};

ManageUsers.propTypes = {
  userList: PropTypes.array.isRequired,
  roles: PropTypes.array.isRequired,
  waitlist: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
};

// withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker
export default withTracker(() => {
  const subscribeUser = UserProfiles.subscribe();
  const subscribeSuperUser = SuperUserProfiles.subscribe();
  const subscribeAdmin = AdminProfiles.subscribe();
  const subscribeWaitlist = Meteor.subscribe("waitlist");

  // Determine if the subscription is ready
  const ready = subscribeAdmin.ready() && subscribeSuperUser.ready() && subscribeUser.ready() && subscribeWaitlist.ready();

  const users = UserProfiles.find({}, { sort: { lastName: 1 } }).fetch();
  const superusers = SuperUserProfiles.find({}, { sort: { lastName: 1 } }).fetch();
  const admins = AdminProfiles.find({}, { sort: { lastName: 1 } }).fetch();

  function compare(a, b) {
    if (a.lastName < b.lastName) {
      return -1;
    }
    if (a.lastName > b.lastName) {
      return 1;
    }
    if (a.lastName === b.lastName) {
      if (a.firstName < b.firstName) {
        return -1;
      }
      if (a.firstName > b.firstName) {
        return 1;
      }
    }
    return 0;
  }

  const userList = users.concat(superusers, admins).sort(compare);
  const waitlist = Meteor.users.find({}, { fields: { "services.resume": 1 } }).fetch();
  const roles = [
    { key: 'USER', text: 'Student', value: 'USER' },
    { key: 'SUPERUSER', text: 'Doctor', value: 'SUPERUSER' },
    { key: 'ADMIN', text: 'Administrator', value: 'ADMIN' },
  ];

  return {
    userList,
    roles,
    waitlist,
    ready,
  };
})(ManageUsers);
