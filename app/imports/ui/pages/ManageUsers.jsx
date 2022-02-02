import React, { useState } from 'react';
import { Container, Header, Loader, Icon, Segment, Card, Input, Dropdown } from 'semantic-ui-react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { Meteor } from 'meteor/meteor';
// import { Accounts } from 'meteor/accounts-base';
import { UserProfiles } from '../../api/user/UserProfileCollection';
import { SuperUserProfiles } from '../../api/user/SuperUserProfileCollection';
import { AdminProfiles } from '../../api/user/AdminProfileCollection';
import { removeItMethod } from '../../api/base/BaseCollection.methods';
// import { PAGE_IDS } from '../utilities/PageIDs';

const deleteUser = (userID, profileID, role) => {
  swal({
    title: 'Are you sure?',
    text: `Do you really want to delete this user?`,
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
        Meteor.users.remove({ _id: userID });

        Meteor.roleAssignment.remove({ 'user._id': userID }); // maybe there's a better way?

        let collectionName;
        if (role === 'USER') {
          collectionName = UserProfiles.getCollectionName();
        } else if (role === 'SUPERUSER') {
          collectionName = SuperUserProfiles.getCollectionName();
        } else {
          collectionName = AdminProfiles.getCollectionName();
        }
        removeItMethod.callPromise({ collectionName, instance: profileID })
          .then(() => {
            swal('Success', `User deleted successfully`, 'success', { buttons: false, timer: 3000 });
          })
          .catch(error => swal('Error', error.message, 'error'));
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
            <Input placeholder='Search users...' value={userFilter} onChange={(event, {value}) => setUserFilter(value)} />
          </Segment>
          <Segment>
            <Card.Group>
              {
                userList.filter(({firstName, lastName}) => firstName.concat(' ', lastName).toLowerCase().includes(userFilter.toLowerCase()))
                        .map(user =>
                  <Card fluid key={user._id}>
                    <Card.Content>
                      <Card.Header>{`${user.lastName}, ${user.firstName}`}</Card.Header>
                      <Card.Meta>{`Email: ${user.email}`}</Card.Meta>
                      <Card.Description>
                        <label>{'Role: '}</label>
                        <Dropdown
                          inline
                          options={roles}
                          value={user.role}
                        />
                        <span className='delete-user' onClick={() => deleteUser(user.userID, user._id, user.role)}>
                          <Icon name='trash alternate' />
                          Delete User
                        </span>
                      </Card.Description>
                    </Card.Content>
                  </Card>
                )
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
    if ( a.lastName < b.lastName ){
      return -1;
    }
    if ( a.lastName > b.lastName ){
      return 1;
    }
    return 0;
  }

  const userList = users.concat(superusers, admins).sort(compare);

  const roles = [
    { key: 'USER', text: 'Volunteer', value: 'USER' },
    { key: 'SUPERUSER', text: 'Doctor', value: 'SUPERUSER' },
    { key: 'ADMIN', text: 'Administrator', value: 'ADMIN' }
  ];

  return {
    userList,
    roles,
    ready,
  };
})(ManageUsers);
