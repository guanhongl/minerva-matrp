import React, { useState } from 'react';
import { Grid, Header, Form, Button, Tab, Loader, Dropdown } from 'semantic-ui-react';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import swal from 'sweetalert';
import { Sites } from '../../api/site/SiteCollection';
import { Supplys } from '../../api/supply/SupplyCollection';
import { Historicals } from '../../api/historical/HistoricalCollection';
import { dispenseTypes, distinct, getOptions } from '../utilities/Functions';
// import { defineMethod, updateMethod } from '../../api/base/BaseCollection.methods';

/** handle submit for Dispense Supply. */

/** validates the dispense supply form */
const validateForm = (data) => { // include "callback" when submit functions works
  const submitData = { ...data, dispensedFrom: Meteor.user().username };
  let errorMsg = '';
  // the required String fields
  const requiredFields = ['dispensedTo', 'site', 'supply', 'quantity'];

  // check required fields
  requiredFields.forEach(field => {
    if (!submitData[field]) {
      errorMsg += `${field} cannot be empty.\n`;
    }
  });

  if (errorMsg) {
    swal('Error', `${errorMsg}`, 'error');
  } else {
    submitData.quantity = parseInt(data.quantity, 10);
    // submit(submitData, callback);
  }
};

/** Renders the Page for Dispensing Supply. */
const DispenseSupplies = ({ ready, sites, supplys }) => {
  const [fields, setFields] = useState({
    site: '',
    dateDispensed: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    supply: '',
    supplyType: '',
    quantity: '',
    dispensedTo: '',
    note: '',
    dispenseType: 'Patient Use',
  });
  // const [maxQuantity, setMaxQuantity] = useState(0);
  const isDisabled = fields.dispenseType !== 'Patient Use';

  const handleChange = (event, { name, value }) => {
    setFields({ ...fields, [name]: value });
  };

  // handle supply select

  const clearForm = () => {
    setFields({ ...fields, site: '', supply: '', quantity: '',
      dispensedTo: '', note: '' });
  };
  if (ready) {
    return (
      <Tab.Pane id='dispense-form'>
        <Header as="h2">
          <Header.Content>
            <Dropdown inline name='dispenseType' options={dispenseTypes}
              onChange={handleChange} value={fields.dispenseType} />
            Dispense from Supplies Inventory Form
            <Header.Subheader>
              <i>Please input the following information, to the best of your abilities, to dispense a Patient or Lab/Testing supply from the inventory</i>
            </Header.Subheader>
          </Header.Content>
        </Header>
        <Form>
          <Grid columns='equal' stackable>
            <Grid.Row>
              <Grid.Column>
                <Form.Input type="datetime-local" label='Date Dispensed' name='dateDispensed'
                  onChange={handleChange} value={fields.dateDispensed}/>
              </Grid.Column>
              <Grid.Column className='filler-column' />
              <Grid.Column className='filler-column' />
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.Input label='Dispensed By' name='dispensedFrom' onChange={handleChange}
                  value={'' || Meteor.user().username} readOnly/>             </Grid.Column>
              <Grid.Column>
                <Form.Input label='Dispensed To' placeholder="Patient Number"
                  disabled={isDisabled} name='dispensedTo' onChange={handleChange} value={fields.dispensedTo}/>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.Select clearable search label='Site' options={getOptions(sites)}
                  placeholder="Kaka’ako" name='site'
                  onChange={handleChange} disabled={isDisabled}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Select clearable search label='Supply Name' options={getOptions(supplys)}
                  placeholder="Wipes & Washables/Test Strips/Brace"
                  name='supply' onChange={handleChange} value={fields.supply}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Group>
                  <Form.Input label='Quantity'
                    type='number' min={1} name='quantity' className='quantity'
                    onChange={handleChange} value={fields.quantity} placeholder='30'/>
                </Form.Group>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.TextArea label='Additional Notes' name='note' onChange={handleChange} value={fields.note}
                  placeholder="Please add any additional notes, special instructions, or information that should be known here."/>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Form>
        <div className='buttons-div'>
          <Button className='clear-button' onClick={clearForm}>Clear Fields</Button>
          <Button className='submit-button' floated='right' onClick={() => validateForm(fields, clearForm)}>Submit</Button>
        </div>
      </Tab.Pane>
    );
  }
  return (<Loader active>Getting data</Loader>);
};

/** Require an array of Sites, Drugs, LotIds, and Brands in the props. */
DispenseSupplies.propTypes = {
  currentUser: PropTypes.object,
  sites: PropTypes.array.isRequired,
  supplys: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
};

/** withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker */
export default withTracker(() => {
  const supSub = Supplys.subscribeSupply();
  const historySub = Historicals.subscribeHistorical(); // this will be used soon
  const siteSub = Sites.subscribeSite();
  return {
    // TODO: exclude 'N/A'
    currentUser: Meteor.user(),
    sites: distinct('site', Sites),
    supplys: distinct('supply', Supplys),
    ready: siteSub.ready() && historySub.ready() && supSub.ready(),
  };
})(DispenseSupplies);
