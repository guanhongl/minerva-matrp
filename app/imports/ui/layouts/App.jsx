import React from 'react';
import PropTypes from 'prop-types';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import 'semantic-ui-css/semantic.css';
import { Roles } from 'meteor/alanning:roles';
import { HashRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import Landing from '../pages/Landing';
import About from '../pages/About';
import ListStuff from '../pages/ListStuff';
import ListStuffAdmin from '../pages/ListStuffAdmin';
import AddInventory from '../pages/AddInventory';
import DispenseLog from '../pages/DispenseLog';
import NotFound from '../pages/NotFound';
import Signin from '../pages/Signin';
import Signup from '../pages/Signup';
import Signout from '../pages/Signout';
import Password from '../pages/Password';
import Dispense from '../pages/Dispense';
import Status from '../pages/Status';
import ManageDropdowns from '../pages/ManageDropdowns';
import ManageDatabase from '../pages/ManageDatabase';
import ManageUsers from '../pages/ManageUsers';
import ManageNewUsers from '../pages/ManageNewUsers';
import { ROLE } from '../../api/role/Role';

/** Top-level layout component for this application. Called in imports/startup/client/startup.jsx. */
const App = () => {
  const currentUser = useTracker(() => Meteor.userId(), []);

  return (
    <Router>
      {
        currentUser &&
        <NavBar/>
      }
      <Switch>
        <UnprotectedRoute exact path="/" component={Landing}/>
        <UnprotectedRoute exact path="/signin" component={Signin}/>
        <UnprotectedRoute exact path="/signup" component={Signup}/>
        <UnprotectedRoute exact path="/enroll-acct/:token" component={Password} />
        <Route exact path="/signout" component={Signout}/>
        <ProtectedRoute exact path="/about" component={About}/>
        <ProtectedRoute path="/dispense" component={Dispense}/>
        <ProtectedRoute exact path="/status" component={Status}/>
        <ProtectedRoute exact path="/add" component={AddInventory}/>
        <ProtectedRoute exact path="/dispense-log" component={DispenseLog}/>
        {/* <ProtectedRoute path="/list" component={ListStuff}/> */}
        <AdminProtectedRoute exact path="/manage-dropdowns" component={ManageDropdowns}/>
        {/* <AdminProtectedRoute path="/admin" component={ListStuffAdmin}/> */}
        <AdminProtectedRoute exact path="/manage-database" component={ManageDatabase}/>
        <AdminProtectedRoute exact path="/manage-users" component={ManageUsers}/>
        <AdminProtectedRoute exact path="/manage-new-users" component={ManageNewUsers}/>
        <Route component={NotFound}/>
      </Switch>
      {
        currentUser &&
        <Footer/>
      }
    </Router>
  );
};

/**
 * UnprotectedRoute (see React Router v4 sample)
 * Reroute logged in user to /about
 * @param {any} { component: Component, ...rest }
 */
const UnprotectedRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={(props) => {
      const isLogged = Meteor.userId() !== null;
      return (!isLogged) ?
        (<Component {...props} />) :
        (<Redirect to={{ pathname: '/about', state: { from: props.location } }}/>
        );
    }}
  />
);

/**
 * ProtectedRoute (see React Router v4 sample)
 * Checks for Meteor login before routing to the requested page, otherwise goes to signin page.
 * @param {any} { component: Component, ...rest }
 */
const ProtectedRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={(props) => {
      const isLogged = Meteor.userId() !== null;
      return isLogged ?
        (<Component {...props} />) :
        (<Redirect to={{ pathname: '/signin', state: { from: props.location } }}/>
        );
    }}
  />
);

/**
 * AdminProtectedRoute (see React Router v4 sample)
 * Checks for Meteor login and admin role before routing to the requested page, otherwise goes to signin page.
 * @param {any} { component: Component, ...rest }
 */
const AdminProtectedRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={(props) => {
      const isLogged = Meteor.userId() !== null;
      const isAdmin = Roles.userIsInRole(Meteor.userId(), ROLE.ADMIN);
      return (isLogged && isAdmin) ?
        (<Component {...props} />) :
        (<Redirect to={{ pathname: '/signin', state: { from: props.location } }}/>
        );
    }}
  />
);

// Require a component and location to be passed to each UnprotectedRoute.
UnprotectedRoute.propTypes = {
  component: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  location: PropTypes.object,
};

// Require a component and location to be passed to each ProtectedRoute.
ProtectedRoute.propTypes = {
  component: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  location: PropTypes.object,
};

// Require a component and location to be passed to each AdminProtectedRoute.
AdminProtectedRoute.propTypes = {
  component: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  location: PropTypes.object,
};

export default App;
