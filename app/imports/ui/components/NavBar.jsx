import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter, NavLink } from 'react-router-dom';
import { Menu, Dropdown, Header, Icon } from 'semantic-ui-react';
import { Roles } from 'meteor/alanning:roles';
import { ROLE } from '../../api/role/Role';
import { COMPONENT_IDS } from '../utilities/ComponentIDs';
import StatusNotification from '../pages/StatusNotification';

/** The NavBar appears at the top of every page. Rendered by the App Layout component. */
const NavBar = ({ currentUser }) => {
  const [mobile, setMobile] = useState(false);

  const handleMobile = e => {
    // console.log(window.innerWidth)
    if (window.innerWidth < 720) {
      setMobile(true);
    } else {
      setMobile(false);
    }
  };

  useEffect(() => {
    window.addEventListener("resize", handleMobile);
    return () => {
      window.removeEventListener("resize", handleMobile);
    };
  }, [handleMobile]);

  if (mobile) {
    return (
      <Menu id="nav" attached="top" borderless inverted compact>
        <Menu.Item id={COMPONENT_IDS.NAVBAR_LANDING_PAGE} as={NavLink} activeClassName="" exact to="/about">
          <Header inverted as='h1'>Minerva</Header>
        </Menu.Item>
        {
          !!currentUser &&
          <Dropdown item icon='bars' key='bars'>
            <Dropdown.Menu>
              <Dropdown.Item id={COMPONENT_IDS.NAVBAR_ADD_INVENTORY} as={NavLink} activeClassName="active"
                exact to="/add" key='add' content="Add Inventory"/>
              <Dropdown.Item id={COMPONENT_IDS.NAVBAR_DISPENSE} as={NavLink} activeClassName="active" 
                exact to="/dispense" key='dispense' content="Dispense Inventory"/>
              <Dropdown.Item id={COMPONENT_IDS.NAVBAR_STATUS} as={NavLink} activeClassName="active" 
                exact to="/status" key='status' content='Inventory Status'/>
              <Dropdown.Item id={COMPONENT_IDS.NAVBAR_DISPENSE_LOG} as={NavLink} activeClassName="active"
                exact to="/dispense-log" key='dispense-log' content='Dispense Log'/>
            </Dropdown.Menu>
          </Dropdown>
        }
        {
          Roles.userIsInRole(Meteor.userId(), [ROLE.ADMIN]) &&
          <Dropdown id={COMPONENT_IDS.NAVBAR_MANAGE_DROPDOWN} item key="setting" icon='setting'>
            <Dropdown.Menu>
              <Dropdown.Item id={COMPONENT_IDS.NAVBAR_MANAGE_DROPDOWNS} as={NavLink} exact to="/manage-dropdowns" key='manage-dropdowns' content="Dropdowns" />
              <Dropdown.Item id={COMPONENT_IDS.NAVBAR_MANAGE_DROPDOWN_DATABASE} key="manage-database" as={NavLink} exact to="/manage-database" content="Database" />
              <Dropdown.Item id={COMPONENT_IDS.NAVBAR_MANAGE_DROPDOWN_USERS} key="manage-users" as={NavLink} exact to="/manage-users" content="Users"/>
              <Dropdown.Item key="manage-new-users" as={NavLink} exact to="/manage-new-users" content="New Users"/>
            </Dropdown.Menu>
          </Dropdown>
        }
        {/* <Menu.Item id={COMPONENT_IDS.NAVBAR_STATUS_NOTIFICATION} position="right">
          <StatusNotification/>
        </Menu.Item> */}
        <Menu.Item position='right'>
          <Dropdown id={COMPONENT_IDS.NAVBAR_CURRENT_USER} text={currentUser} pointing="top right" icon={'user'}>
            <Dropdown.Menu>
              <Dropdown.Item id={COMPONENT_IDS.NAVBAR_SIGN_OUT} icon="sign out" text="Sign Out" as={NavLink} exact to="/signout"/>
            </Dropdown.Menu>
          </Dropdown>
        </Menu.Item>
      </Menu>
    );
  }

  return (
    <Menu id="nav" attached="top" borderless inverted compact>
      <Menu.Item id={COMPONENT_IDS.NAVBAR_LANDING_PAGE} as={NavLink} activeClassName="" exact to="/about">
        <Header inverted as='h1'>Minerva</Header>
      </Menu.Item>
      {
        !!currentUser &&
        <>
          <Menu.Item id={COMPONENT_IDS.NAVBAR_ADD_INVENTORY} as={NavLink} activeClassName="active" exact to="/add" key='add'>
            Add Inventory
            <Icon name='plus'/>
          </Menu.Item>
          <Menu.Item id={COMPONENT_IDS.NAVBAR_DISPENSE} as={NavLink} activeClassName="active" exact to="/dispense" key='dispense'>
            Dispense Inventory
            <Icon name='pills'/>
          </Menu.Item>
          <Menu.Item id={COMPONENT_IDS.NAVBAR_STATUS} as={NavLink} activeClassName="active" exact to="/status" key='status'>
            Inventory Log
            <Icon name='archive'/>
          </Menu.Item>
          <Menu.Item id={COMPONENT_IDS.NAVBAR_DISPENSE_LOG} as={NavLink} activeClassName="active" exact to="/dispense-log" key='dispense-log'>
            Dispense Log
            <Icon name='book'/>
          </Menu.Item>
        </>
      }
      {
        Roles.userIsInRole(Meteor.userId(), [ROLE.ADMIN]) &&
        <Dropdown id={COMPONENT_IDS.NAVBAR_MANAGE_DROPDOWN} item text="Manage" key="manage">
          <Dropdown.Menu>
            <Dropdown.Item id={COMPONENT_IDS.NAVBAR_MANAGE_DROPDOWNS} as={NavLink} exact to="/manage-dropdowns" key='manage-dropdowns' content="Dropdowns" />
            <Dropdown.Item id={COMPONENT_IDS.NAVBAR_MANAGE_DROPDOWN_DATABASE} key="manage-database" as={NavLink} exact to="/manage-database" content="Database" />
            <Dropdown.Item id={COMPONENT_IDS.NAVBAR_MANAGE_DROPDOWN_USERS} key="manage-users" as={NavLink} exact to="/manage-users" content="Users"/>
            <Dropdown.Item key="manage-new-users" as={NavLink} exact to="/manage-new-users" content="New Users"/>
          </Dropdown.Menu>
        </Dropdown>
      }
      {/* <Menu.Item id={COMPONENT_IDS.NAVBAR_STATUS_NOTIFICATION} position="right">
        <StatusNotification/>
      </Menu.Item> */}
      <Menu.Item position='right'>
        <Dropdown id={COMPONENT_IDS.NAVBAR_CURRENT_USER} text={currentUser} pointing="top right" icon={'user'}>
          <Dropdown.Menu>
            <Dropdown.Item id={COMPONENT_IDS.NAVBAR_SIGN_OUT} icon="sign out" text="Sign Out" as={NavLink} exact to="/signout"/>
          </Dropdown.Menu>
        </Dropdown>
      </Menu.Item>
    </Menu>
  );
};

// Declare the types of all properties.
NavBar.propTypes = {
  currentUser: PropTypes.string,
};

// withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker
const NavBarContainer = withTracker(() => {
  const currentUser = Meteor.user() ? Meteor.user().username : '';
  return {
    currentUser,
  };
})(NavBar);

// Enable ReactRouter for this component. https://reacttraining.com/react-router/web/api/withRouter
export default withRouter(NavBarContainer);
