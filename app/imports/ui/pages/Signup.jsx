import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Container, Form, Grid, Header, Icon } from 'semantic-ui-react';
import swal from 'sweetalert';
import { defineMethod } from '../../api/base/BaseCollection.methods';
import { PAGE_IDS } from '../utilities/PageIDs';
import { COMPONENT_IDS } from '../utilities/ComponentIDs';

/**
 * Signup component is similar to signin component, but we create a new user instead.
 */
const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  // const [error, setError] = useState('');

  // Update the form controls each time the user interacts with them.
  const handleChange = (e, { name, value }) => {
    switch (name) {
    case 'firstName':
      setFirstName(value);
      break;
    case 'lastName':
      setLastName(value);
      break;
    case 'email':
      setEmail(value);
      break;
    default:
        // do nothing.
    }
  };

  /* Handle Signup submission. Create user account and a profile entry, then redirect to the home page. */
  const submit = () => {
    const collectionName = "PendingUsersCollection";
    const definitionData = { firstName, lastName, email, createdAt: new Date() };
    defineMethod.callPromise({ collectionName, definitionData })
      .then(() => {
        swal('Success', 'Registration successful', 'success');
        setFirstName('');
        setLastName('');
        setEmail('');
      })
      .catch(error => swal('Error', error.message, 'error'));
  };

  return (
    <div id='signup-div'>
      <Container id={PAGE_IDS.SIGN_UP}>
        <Grid textAlign="center" centered>
          <Grid.Column computer={7} tablet={7} mobile={9} textAlign='center'>
            <Icon name='stethoscope' size='huge' style={{ visibility: 'hidden' }}/>
            <Header as="h1" textAlign="center" style={{ marginLeft: '-15px' }}>
              MINERVA
            </Header>
          </Grid.Column>
          <Grid.Column width={9}>
            <Header as="h2" textAlign="center">
              WELCOME TO MINERVA MEDICAL, REGISTER FOR AN ACCOUNT BELOW!
            </Header>
            <Form onSubmit={submit}>
              <Form.Group widths="equal">
                <Form.Input label="First Name" name="firstName" placeholder="First name" value={firstName} onChange={handleChange} />
                <Form.Input label="Last Name" name="lastName" placeholder="Last name" value={lastName} onChange={handleChange} />
              </Form.Group>
              <Form.Input
                label="Email"
                id={COMPONENT_IDS.SIGN_UP_FORM_EMAIL}
                icon="user"
                iconPosition="left"
                name="email"
                type="email"
                placeholder="E-mail address"
                value={email}
                onChange={handleChange}
              />
              <Form.Button id={COMPONENT_IDS.SIGN_UP_FORM_SUBMIT} content="Submit"/>
            </Form>
            <div className='signin-message'>
              <h3>Already have a registered account? <NavLink exact to="/signin" key="signin" id="signIn">LOG IN</NavLink></h3>
            </div>
          </Grid.Column>
        </Grid>
      </Container>
    </div>
  );
};

export default Signup;
