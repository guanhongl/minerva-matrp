import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useParams, Redirect } from 'react-router';
// import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Container, Form, Grid, Header, Message, Icon } from 'semantic-ui-react';
// import { PAGE_IDS } from '../utilities/PageIDs';
// import { COMPONENT_IDS } from '../utilities/ComponentIDs';

/**
 * Password page
 */
const Password = ({ location }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [redirectToReferer, setRedirectToReferer] = useState(false);
  const { token } = useParams();

  // Update the form controls each time the user interacts with them.
  const handleChange = (e, { name, value }) => {
    switch (name) {
    case 'password':
      setPassword(value);
      break;
    case 'confirmPassword':
      setConfirmPassword(value);
      break;
    default:
        // do nothing.
    }
  };

  // Handle Password submission using Meteor's account mechanism.
  const submit = () => {
    if (password !== confirmPassword) {
      swal('Error', 'Passwords do not match.', 'error');
    }
    else {
      Accounts.resetPassword(token, password, (err) => {
        if (err) {
          setError(err.reason);
        } else {
          setError('');
          setRedirectToReferer(true);
        }
      });
    }
  };

  /* Display the password form. Redirect to about page after successful login. */
  const { from } = location.state || { from: { pathname: '/about' } };
  // if correct authentication, redirect to from: page instead of password screen
  if (redirectToReferer) {
    return <Redirect to={from} />;
  }
  return (
    <div id='signin-div'>
      <Container>
        <Grid textAlign="center" centered columns={2}>
          <Grid.Column computer={7} tablet={7} mobile={9}>
            <Icon name='stethoscope' size='huge' style={{ visibility: 'hidden' }}/>
            <Header as="h1" textAlign="center" style={{ marginLeft: '10px' }}>
                MINERVA
            </Header>
          </Grid.Column>
          <Grid.Column width={9}>
            <Header as="h2" textAlign="center">
              ALMOST THERE...
            </Header>
            <Form onSubmit={submit}>
              <Form.Input
                label="Password"
                // id={COMPONENT_IDS.SIGN_IN_FORM_PASSWORD}
                icon="lock"
                iconPosition="left"
                name="password"
                placeholder="Password"
                type="password"
                onChange={handleChange}
              />
              <Form.Input
                label="Confirm Password"
                // id={COMPONENT_IDS.SIGN_IN_FORM_PASSWORD}
                icon="lock"
                iconPosition="left"
                name="confirmPassword"
                placeholder="Confirm Password"
                type="password"
                onChange={handleChange}
              />
              <Form.Button content="Login"/>
            </Form>
            {error === '' ? (
              ''
            ) : (
              <Message
                error
                header="Login was not successful"
                content={error}
              />
            )}
          </Grid.Column>
        </Grid>
      </Container>
    </div>
  );
};

/* Ensure that the React Router location object is available in case we need to redirect. */
Password.propTypes = {
  location: PropTypes.object,
};

export default Password;
