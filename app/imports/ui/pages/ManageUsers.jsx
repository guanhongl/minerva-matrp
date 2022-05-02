import React, { useState } from 'react';
import { Container, Header, Loader, Icon, Segment, Card, Input, Dropdown } from 'semantic-ui-react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import swal from 'sweetalert';
// import { Accounts } from 'meteor/accounts-base';
import { UserProfiles } from '../../api/user/UserProfileCollection';
import { SuperUserProfiles } from '../../api/user/SuperUserProfileCollection';
import { AdminProfiles } from '../../api/user/AdminProfileCollection';
import { removeItMethod } from '../../api/base/BaseCollection.methods';
import { removeUserMethod, updateRoleMethod, defineMethod } from '../../api/ManageUser.methods';
// import { PAGE_IDS } from '../utilities/PageIDs';

const getUserCollectionName = (role) => {
  if (role === 'USER') {
    return UserProfiles.getCollectionName();
  }
  if (role === 'SUPERUSER') {
    return SuperUserProfiles.getCollectionName();
  }
  return AdminProfiles.getCollectionName();
};

const updateRole = ({ email, firstName, lastName, userID, _id: profileID, role }, newRole) => {
  // console.log(userID, profileID, role, newRole)
  removeItMethod.callPromise({ collectionName: getUserCollectionName(role), instance: profileID })
    .then(() => {
      return defineMethod.callPromise({ collectionName: getUserCollectionName(newRole), definitionData: { email, firstName, lastName, userID, role: newRole } });
    })
    .then(() => {
      return updateRoleMethod.callPromise({ userID, role: newRole });
    })
    .then(() => {
      swal('Success', 'User updated successfully', 'success', { buttons: false, timer: 3000 });
    })
    .catch((error) => swal('Error', error.message, 'error'));
};

const deleteUser = ({ userID, _id: profileID, role }) => {
  swal({
    title: 'Are you sure?',
    text: 'Do you really want to delete this user?',
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
        const collectionName = getUserCollectionName(role);
        removeItMethod.callPromise({ collectionName, instance: profileID })
          .then(() => {
            swal('Success', 'User deleted successfully', 'success', { buttons: false, timer: 3000 });
          })
          .catch(error => swal('Error', error.message, 'error'));

        removeUserMethod.call({ userID, username: '' });
      }
    });
};

/** Renders a table containing all of the Stuff documents. Use <StuffItem> to render each row. */
const ManageUsers = ({ ready, userList, roles }) => {
  const [userFilter, setUserFilter] = useState('');

  return (
    (ready) ? (
      <Container id='manage-users'>
        <Segment.Group>
          <Segment className='manage-user-header'>
            <Header as="h2">Manage Users</Header>
            <Input placeholder='Search users...' value={userFilter} onChange={(event, { value }) => setUserFilter(value)} />
          </Segment>
          <Segment>
            <Card.Group>
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
            </Card.Group>
          </Segment>
        </Segment.Group>
      </Container>
    ) : <Loader active>Getting data</Loader>
  );
};

ManageUsers.propTypes = {
  userList: PropTypes.array.isRequired,
  roles: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
};

// withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker
export default withTracker(() => {
  const subscribeUser = UserProfiles.subscribe();
  const subscribeSuperUser = SuperUserProfiles.subscribe();
  const subscribeAdmin = AdminProfiles.subscribe();

  // Determine if the subscription is ready
  const ready = subscribeAdmin.ready() && subscribeSuperUser.ready() && subscribeUser.ready();

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
    return 0;
  }

  const userList = users.concat(superusers, admins).sort(compare);

  const roles = [
    { key: 'USER', text: 'Student', value: 'USER' },
    { key: 'SUPERUSER', text: 'Doctor', value: 'SUPERUSER' },
    { key: 'ADMIN', text: 'Administrator', value: 'ADMIN' },
  ];

  return {
    userList,
    roles,
    ready,
  };
})(ManageUsers);
