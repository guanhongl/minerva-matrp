import React, { useState, useEffect } from 'react';
import { Grid, Header, Form, Button, Tab, Loader, Dropdown } from 'semantic-ui-react';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
import swal from 'sweetalert';
import moment from 'moment';
import { Sites } from '../../../api/site/SiteCollection';
import { Supplys, supplyTypes } from '../../../api/supply/SupplyCollection';
import { dispenseTypes } from '../../../api/historical/HistoricalCollection';
import { distinct, getOptions, useQuery } from '../../utilities/Functions';
import { defineMethod, updateMethod } from '../../../api/base/BaseCollection.methods';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { Locations } from '../../../api/location/LocationCollection';
import { cloneDeep } from 'lodash';

/** handle submit for Dispense Supply. */
const submit = (data, callback) => {
  const { inventoryType, dispenseType, dateDispensed, dispensedFrom, dispensedTo, site, supply, note, 
          supplyType, quantity, donated, donatedBy, location } = data;
  const collectionName = Supplys.getCollectionName();
  const supplyItem = Supplys.findOne({ supply }); // find the existing supply
  const { _id, stock } = supplyItem;
  const copy = cloneDeep({ id: _id, stock }); // the copy of the record to update
  const targetIndex = stock.findIndex((obj => obj.location === location)); // find the index of existing the supply
  const { quantity: targetQuantity } = stock[targetIndex];

  // if dispense quantity > supply quantity:
  if (quantity > targetQuantity) {
    swal('Error', `${supply} only has ${targetQuantity}`, 'error');
  } else {
    // if dispense quantity < supply quantity:
    if (quantity < targetQuantity) {
      stock[targetIndex].quantity -= quantity; // decrement the quantity
    } else {
      // else if dispense quantity === supply quantity:
      stock.splice(targetIndex, 1); // remove the stock
    }
    const updateData = { id: _id, stock };
    const element = [{ name: supply, supplyType, quantity, donated, donatedBy }];
    const definitionData = { inventoryType, dispenseType, dateDispensed, dispensedFrom, dispensedTo, site, note, element };

    updateMethod.callPromise({ collectionName, updateData })
      .then(() => {
        return defineMethod.callPromise({ collectionName: 'HistoricalsCollection', definitionData });
      })
      .then(() => {
        swal('Success', `${supply} updated successfully`, 'success', { buttons: false, timer: 3000 });
        callback(); // resets the form
      })
      // if update or define fail, restore the copy
      .catch(error => {
        updateMethod.call({ collectionName, updateData: copy });
        swal('Error', error.message, 'error');
      });
  }
};

/** validates the dispense supply form */
const validateForm = (data, callback) => {
  const submitData = { ...data, dispensedFrom: Meteor.user().username };

  if (data.dispenseType !== 'Patient Use') { // handle non patient use dispense
    submitData.dispensedTo = '-';
    submitData.site = '-';
  }

  let errorMsg = '';
  // the required String fields
  const requiredFields = ['dispensedTo', 'site', 'supply', 'supplyType', 'quantity'];

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
    submit(submitData, callback);
  }
};

/** Renders the Page for Dispensing Supply. */
const DispenseSupplies = ({ ready, sites, supplys, locations }) => {
  const query = useQuery();

  const [fields, setFields] = useState({
    inventoryType: 'Supply',
    dispenseType: 'Patient Use',
    dateDispensed: moment().format('YYYY-MM-DDTHH:mm'),
    dispensedTo: '',
    site: '',
    supply: '',
    supplyType: '',
    quantity: '',
    donated: false,
    donatedBy: '',
    note: '',
    location: '', // to find supply
  });
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [filteredLocations, setFilteredLocations] = useState([]);
  useEffect(() => {
    setFilteredLocations(locations);
  }, [locations]);

  const isDisabled = fields.dispenseType !== 'Patient Use';

  useEffect(() => {
    const supply = query.get("supply");
    const location = query.get("location");
    if (supply && location && ready) {
      const target = Supplys.findOne({ supply, stock: { $elemMatch: { location } } });
      // autofill the form with specific supply info
      const { supplyType } = target;

      targetLocation = target.stock.find(obj => obj.location === location);
      const { quantity, donated, donatedBy } = targetLocation;

      const autoFields = { ...fields, supply, location, supplyType, donated, donatedBy };
      setFields(autoFields);

      setMaxQuantity(quantity);
    }
  }, [ready]);

  // update date dispensed every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setFields({ ...fields, dateDispensed: moment().format('YYYY-MM-DDTHH:mm') });
    }, 1000 * 60);
    return () => clearInterval(interval);
  });

  const handleChange = (event, { name, value }) => {
    setFields({ ...fields, [name]: value });
  };

  const handleCheck = (event, { name, checked }) => {
    if (!checked) {
      setFields({ ...fields, [name]: checked, donatedBy: '' });
    } else {
      setFields({ ...fields, [name]: checked });
    }
  };

  // handle supply select; filter locations
  const onSupplySelect = (event, { value: supply }) => {
    const target = Supplys.findOne({ supply });
    // if supply is not empty:
    if (target) {
      setFields({ ...fields, supply });
      setFilteredLocations(_.pluck(target.stock, 'location'));
    } else {
      // else reset specific supply info
      setFields({ ...fields, supply });
      setFilteredLocations(locations);
    }
  };

  // autofill form if supply and location are selected
  useEffect(() => {
    if (fields.supply && fields.location) {
      const target = Supplys.findOne({ supply: fields.supply, stock: { $elemMatch: { location: fields.location } } });

      // if supply w/ name and location exists:
      if (target) {
        // autofill the form with specific supply info
        const { supplyType } = target;

        targetLocation = target.stock.find(obj => obj.location === fields.location);
        const { quantity, donated, donatedBy } = targetLocation;

        const autoFields = { ...fields, supplyType, donated, donatedBy };
        setFields(autoFields);

        setMaxQuantity(quantity);
      }
    } else {
      setFields({ ...fields, supplyType: '', donated: false, donatedBy: '' });
      setMaxQuantity(0);
    }
  }, [fields.supply, fields.location]);

  const clearForm = () => {
    setFields({ ...fields, dispenseType: 'Patient Use', site: '', supply: '', supplyType: '', quantity: '',
      dispensedTo: '', location: '', donated: false, donatedBy: '', note: '' });
    setMaxQuantity(0);
    setFilteredLocations(locations);
  };

  if (ready) {
    return (
      <Tab.Pane id='dispense-form'>
        <Header as="h2">
          <Header.Content>
            <Dropdown inline name='dispenseType' options={getOptions(dispenseTypes)}
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
                  value={'' || Meteor.user().username} readOnly/>
              </Grid.Column>
              <Grid.Column>
                <Form.Input label='Dispensed To' placeholder="Patient Number"
                  disabled={isDisabled} name='dispensedTo' onChange={handleChange} value={fields.dispensedTo}
                  id={COMPONENT_IDS.DISPENSE_SUP_PT_NUM}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Select clearable search label='Site' options={getOptions(sites)}
                  placeholder="Kaka’ako" name='site' disabled={isDisabled}
                  onChange={handleChange} value={fields.site} id={COMPONENT_IDS.DISPENSE_SUP_SITE}/>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.Select clearable search label='Supply Name' options={getOptions(supplys)}
                  placeholder="Wipes & Washables/Test Strips/Brace"
                  name='supply' onChange={onSupplySelect} value={fields.supply} id={COMPONENT_IDS.DISPENSE_SUP_NAME}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Select clearable search label='Location' options={getOptions(filteredLocations)}
                  placeholder="Case 2" name='location'
                  onChange={handleChange} value={fields.location} id={COMPONENT_IDS.DISPENSE_SUP_LOCATION}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Group>
                  <Form.Input label={maxQuantity ? `Quantity (${maxQuantity} remaining)` : 'Quantity'}
                    type='number' min={1} name='quantity' className='quantity'
                    onChange={handleChange} value={fields.quantity} placeholder='30' id={COMPONENT_IDS.DISPENSE_SUP_QUANTITY}/>
                </Form.Group>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.Select clearable label='Supply Type' options={getOptions(supplyTypes)}
                    placeholder="Patient" name='supplyType' 
                    onChange={handleChange} value={fields.supplyType} />
              </Grid.Column>
              <Grid.Column>
                <Form.Field>
                  <label>Donated</label>
                  <Form.Group>
                    <Form.Checkbox name='donated' className='donated-field'
                      onChange={handleCheck} checked={fields.donated} id={COMPONENT_IDS.DISPENSE_SUP_DONATED}/>
                    <Form.Input name='donatedBy' className='donated-by-field' placeholder='Donated By'
                      onChange={handleChange} value={fields.donatedBy} disabled={!fields.donated} id={COMPONENT_IDS.DISPENSE_SUP_DONATED_INPUT}/>
                  </Form.Group>
                </Form.Field>
              </Grid.Column>
              <Grid.Column className='filler-column' />
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.TextArea label='Additional Notes' name='note' onChange={handleChange} value={fields.note}
                  placeholder="Please add any additional notes, special instructions, or information that should be known here."
                  id={COMPONENT_IDS.DISPENSE_SUP_NOTES}/>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Form>
        <div className='buttons-div'>
          <Button className='clear-button' onClick={clearForm} id={COMPONENT_IDS.DISPENSE_SUP_CLEAR}>Clear Fields</Button>
          <Button className='submit-button' floated='right' onClick={() => validateForm(fields, clearForm)}>Submit</Button>
          {/* <Button className='submit-button' floated='right' onClick={() => alert('Under Maintenance...')}>Submit</Button> */}
        </div>
      </Tab.Pane>
    );
  }
  return (<Loader active>Getting data</Loader>);
};

DispenseSupplies.propTypes = {
  sites: PropTypes.array.isRequired,
  supplys: PropTypes.array.isRequired,
  locations: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
};

/** withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker */
export default withTracker(() => {
  const supplySub = Supplys.subscribeSupply();
  const siteSub = Sites.subscribeSite();
  const locationSub = Locations.subscribeLocation();

  return {
    sites: distinct('site', Sites),
    supplys: distinct('supply', Supplys),
    locations: distinct('location', Locations),
    ready: siteSub.ready() && supplySub.ready() && locationSub.ready(),
  };
})(DispenseSupplies);
