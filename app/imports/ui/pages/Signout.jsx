import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Button, Divider, Header, Icon } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import { PAGE_IDS } from '../utilities/PageIDs';

/** After the user clicks the "Signout" link in the NavBar, log them out and display this page. */
const Signout = () => {
  Meteor.logout();
  return (
    <div id={PAGE_IDS.SIGN_OUT}>
      <Header as="h1" textAlign="center">MINERVA MEDICAL</Header>
      <Header as="h2" textAlign="center">You have successfully signed out. Come Back Soon!</Header>
      <Divider section hidden/>
      <div className='controls'>
        <Button as={NavLink} activeClassName="" exact to="/" key='landing' color="black" size='huge'>
          <Icon name='home'/> 
          HOME
        </Button>
        <Button as={NavLink} activeClassName="" exact to="/signin" key='signin' size='huge' inverted>
          LOGIN
        </Button>
      </div>
    </div>
  );
};

export default Signout;
