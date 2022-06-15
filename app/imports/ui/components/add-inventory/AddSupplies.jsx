import React, { useEffect, useState } from 'react';
import { Grid, Header, Form, Button, Tab, Loader } from 'semantic-ui-react';
import swal from 'sweetalert';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import QRCode from 'qrcode';
import { Random } from 'meteor/random'
import { Supplys, supplyTypes } from '../../../api/supply/SupplyCollection';
import { Locations } from '../../../api/location/LocationCollection';
import { defineMethod, updateMethod } from '../../../api/base/BaseCollection.methods';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { distinct, getOptions, printQRCode } from '../../utilities/Functions';

/** handles submit for add supply. */
const submit = (data, callback) => {
  const { supply, supplyType, minQuantity, quantity, location, donated, donatedBy, note } = data;
  const collectionName = Supplys.getCollectionName();
  const exists = Supplys.findOne({ supply }); // returns the existing supply or undefined

  // attempts to find an existing _id
  const exists_id = exists?.stock?.find(obj => obj.location === location && obj.donated === donated)?._id;

  // generate the QRCode and the uuid for the location + donated
  const _id = exists_id ?? Random.id();
  QRCode.toDataURL(`${window.location.origin}/#/dispense?tab=2&_id=${_id}`)
    .then(url => {
      // if the supply does not exist:
      if (!exists) {
        // insert the new supply and stock
        const newStock = { _id, quantity, location, donated, donatedBy, note, QRCode: url };
        const definitionData = { supply, supplyType, minQuantity, stock: [newStock] };
        defineMethod.callPromise({ collectionName, definitionData })
          .then(() => {
            swal('Success', `${supply} added successfully`, url, { buttons: ['OK', 'Print'] })
              .then(isPrint => {
                if (isPrint) {
                  printQRCode(url);
                }
              });
            callback(); // resets the form
          })
          .catch(error => swal('Error', error.message, 'error'));
      } else {
        const { stock } = exists;
        const target = stock.find(obj => obj.location === location && obj.donated === donated);
        // if location + donated exists, increment the quantity:
        if (target) {
          target.quantity += quantity;
        } else {
          // else append the new location + donated
          stock.push({ _id, location, quantity, donated, donatedBy, note, QRCode: url });
        }
        const updateData = { id: exists._id, stock };
        updateMethod.callPromise({ collectionName, updateData })
          .then(() => {
            swal('Success', `${supply} updated successfully`, url, { buttons: ['OK', 'Print'] })
              .then(isPrint => {
                if (isPrint) {
                  printQRCode(url);
                }
              });
            callback(); // resets the form
          })
          .catch(error => swal('Error', error.message, 'error'));
      }
    })
    .catch(error => swal('Error', error, 'error'));
};

/** validates the add supply form */
const validateForm = (data, callback) => {
  const submitData = { ...data };
  let errorMsg = '';
  // the required String fields
  const requiredFields = ['supply', 'supplyType', 'minQuantity', 'location', 'quantity'];

  // if the field is empty, append error message
  requiredFields.forEach(field => {
    if (!submitData[field]) {
      errorMsg += `${field} cannot be empty.\n`;
    }
  });

  if (errorMsg) {
    swal('Error', `${errorMsg}`, 'error');
  } else {
    submitData.minQuantity = parseInt(data.minQuantity, 10);
    submitData.quantity = parseInt(data.quantity, 10);
    submit(submitData, callback);
  }
};

/** Renders the Page for Add Supplies. */
// fields: supply, supplyType, minQuantity, quantity, location, donated, donatedBy, note
const AddSupplies = ({ supplys, locations, ready }) => {
  const [fields, setFields] = useState({
    supply: '',
    supplyType: '',
    minQuantity: '',
    quantity: '',
    location: '',
    note: '',
    donated: false,
    donatedBy: '',
  });
  const isDisabled = supplys.includes(fields.supply);

  // a copy of supplies and filtered supplies and their respective filters
  const [newSupplys, setNewSupplys] = useState([]);
  useEffect(() => {
    setNewSupplys(supplys);
  }, [supplys]);
  const [filteredSupplys, setFilteredSupplys] = useState([]);
  useEffect(() => {
    setFilteredSupplys(newSupplys);
  }, [newSupplys]);

  // handles adding a new supply; IS case sensitive
  const onAddSupply = (event, { value }) => {
    if (!newSupplys.map(supply => supply.toLowerCase()).includes(value.toLowerCase())) {
      setNewSupplys([...newSupplys, value]);
    }
  };

  // handles supply select
  const onSupplySelect = (event, { value: supply }) => {
    const target = Supplys.findOne({ supply });
    // if the supply exists:
    if (target) {
      // autofill the form with specific supply info
      const { supplyType, minQuantity } = target;
      setFields({ ...fields, supply, supplyType, minQuantity });
    } else {
      // else reset specific supply info
      setFields({ ...fields, supply, supplyType: '', minQuantity: '' });
      // reset the filters
      setFilteredSupplys(newSupplys);
    }
  };

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

  const clearForm = () => {
    setFields({ supply: '', supplyType: '', minQuantity: '', quantity: '', location: '', donated: false, donatedBy: '', note: '' });
    setFilteredSupplys(newSupplys);
  };

  if (ready) {
    return (
      <Tab.Pane id={COMPONENT_IDS.ADD_FORM}>
        <Header as="h2">
          <Header.Content>
            Add Supplies to Inventory Form
            <Header.Subheader>
              <i>Please input the following information to add to the inventory, to the best of your abilities.</i>
            </Header.Subheader>
          </Header.Content>
        </Header>
        <Form>
          <Grid columns='equal' stackable>
            <Grid.Row>
              <Grid.Column>
                <Form.Select clearable search label='Supply Name' options={getOptions(newSupplys)}
                  placeholder="Hot Packs" name='supply' onChange={onSupplySelect} value={fields.supply}
                  allowAdditions onAddItem={onAddSupply} id={COMPONENT_IDS.ADD_SUPPLY_NAME} />
              </Grid.Column>
              <Grid.Column className='filler-column' />
              <Grid.Column className='filler-column' />
            </Grid.Row>

            <Grid.Row>
              <Grid.Column>
                <Form.Select clearable label='Supply Type' options={getOptions(supplyTypes)} placeholder="Patient"
                  name='supplyType' onChange={handleChange} value={fields.supplyType} id={COMPONENT_IDS.ADD_SUPPLY_TYPE} disabled={isDisabled}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Input label='Minimum Quantity' type='number' min={1} name='minQuantity' className='quantity'
                  onChange={handleChange} value={fields.minQuantity} placeholder="50"
                  id={COMPONENT_IDS.ADD_SUPPLY_MIN_QUANTITY} disabled={isDisabled} />
              </Grid.Column>
              <Grid.Column className='filler-column' />
            </Grid.Row>

            <Grid.Row>
              <Grid.Column>
                <Form.Input label='Quantity' type='number' min={1} name='quantity' placeholder='10'
                  onChange={handleChange} value={fields.quantity} id={COMPONENT_IDS.ADD_SUPPLY_QUANTITY} />
              </Grid.Column>
              <Grid.Column>
                <Form.Select clearable search label='Location' options={getOptions(locations)} placeholder='Cabinet 1'
                  name='location' onChange={handleChange} value={fields.location} id={COMPONENT_IDS.ADD_SUPPLY_LOCATION}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Field>
                  <label>Donated</label>
                  <Form.Group>
                    <Form.Checkbox name='donated' className='donated-field'
                      onChange={handleCheck} checked={fields.donated}/>
                    <Form.Input name='donatedBy' className='donated-by-field' placeholder='Donated By'
                      onChange={handleChange} value={fields.donatedBy} disabled={!fields.donated} />
                  </Form.Group>
                </Form.Field>
              </Grid.Column>

            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.TextArea label='Additional Notes' name='note' onChange={handleChange} value={fields.note}
                  placeholder="Please add any additional notes, special instructions, or information that should be known here."
                  id={COMPONENT_IDS.ADD_SUPPLY_NOTES}/>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Form>
        <div className='buttons-div'>
          <Button className='clear-button' id={COMPONENT_IDS.ADD_SUPPLY_CLEAR} onClick={clearForm}>Clear Fields</Button>
          <Button className='submit-button' floated='right' onClick={() => validateForm(fields, clearForm)} id={COMPONENT_IDS.ADD_SUPPLY_SUBMIT}>Submit</Button>
        </div>
      </Tab.Pane>
    );
  }
  return (<Loader active>Getting data</Loader>);
};

AddSupplies.propTypes = {
  supplys: PropTypes.array.isRequired,
  locations: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
};

/** withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker */
export default withTracker(() => {
  const supplySub = Supplys.subscribeSupply();
  const locationSub = Locations.subscribeLocation();
  return {
    supplys: distinct('supply', Supplys),
    locations: distinct('location', Locations),
    ready: supplySub.ready() && locationSub.ready(),
  };
})(AddSupplies);
