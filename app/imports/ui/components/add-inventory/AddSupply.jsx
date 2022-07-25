import React, { useEffect, useState } from 'react';
import { Grid, Header, Form, Button, Tab, Loader } from 'semantic-ui-react';
import swal from 'sweetalert';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { supplyTypes } from '../../../api/supply/SupplyCollection';
import { SupplyNames } from '../../../api/supplyName/SupplyNameCollection';
import { Locations } from '../../../api/location/LocationCollection';
import { findOneMethod } from '../../../api/base/BaseCollection.methods';
import { addMethod } from '../../../api/supply/SupplyCollection.methods';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { fetchField, getOptions, printQRCode } from '../../utilities/Functions';

/** handles submit for add supply. */
const submit = (data, callback) => {
  addMethod.callPromise({ data })
    .then(url => {
      swal('Success', `${data.supply} updated successfully`, url, { buttons: ['OK', 'Print'] })
        .then(isPrint => {
          if (isPrint) {
            printQRCode(url);
          }
        });
      callback(); // resets the form
    })
    .catch(error => swal('Error', error.message, 'error'));
};

/** Renders the Page for Add Supplies. */
// fields: supply, supplyType, minQuantity, quantity, location, donated, donatedBy, note
const AddSupply = ({ names, locations, ready }) => {
  const collectionName = "SupplysCollection";
  const initialState = {
    supply: '',
    supplyType: '',
    minQuantity: '',
    quantity: '',
    location: '',
    note: '',
    donated: false,
    donatedBy: '',
  };

  const [fields, setFields] = useState(initialState);
  // disable supply type and minimum if the supply is populated. 
  // assuming a supply cannot have 1+ types
  const [disabled, setDisabled] = useState(false);
  useEffect(() => {
    findOneMethod.callPromise({ collectionName, selector: { supply: fields.supply } })
      .then(res => setDisabled(!!res));
  }, [fields.supply]);

  // handles supply select
  const onSupplySelect = (event, { value: supply }) => {
    findOneMethod.callPromise({ collectionName, selector: { supply } })
      .then(target => {
        // if the supply exists:
        if (target) {
          // autofill the form with specific supply info
          const { supplyType, minQuantity } = target;
          setFields({ ...fields, supply, supplyType, minQuantity });
        } else {
          // else reset specific supply info
          setFields({ ...fields, supply, supplyType: '', minQuantity: '' });
        }
      });
  };

  // autofill donated by and note on (supply, location, donated) select
  useEffect(() => {
    const selector = { supply: fields.supply, stock: { $elemMatch: { location: fields.location, donated: fields.donated } } }
    findOneMethod.callPromise({ collectionName, selector })
      .then(target => {
        if (!!target) {
          const targetLot = target.stock.find(o => ( o.location === fields.location && o.donated === fields.donated ));
          const { donatedBy = "", note = "" } = targetLot;
          setFields({ ...fields, donatedBy, note });
        } else {
          setFields({ ...fields, donatedBy: '', note: '' });
        }
      });
  }, [fields.supply, fields.location, fields.donated]);

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
    setFields(initialState);
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
                <Form.Select clearable search label='Supply Name' options={getOptions(names)}
                  placeholder="Hot Packs" name='supply' onChange={onSupplySelect} value={fields.supply} id={COMPONENT_IDS.ADD_SUPPLY_NAME} />
              </Grid.Column>
              <Grid.Column className='filler-column' />
              <Grid.Column className='filler-column' />
            </Grid.Row>

            <Grid.Row>
              <Grid.Column>
                <Form.Select clearable label='Supply Type' options={getOptions(supplyTypes)} placeholder="Patient"
                  name='supplyType' onChange={handleChange} value={fields.supplyType} id={COMPONENT_IDS.ADD_SUPPLY_TYPE} disabled={disabled}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Input label='Minimum Quantity' type='number' min={1} name='minQuantity' className='quantity'
                  onChange={handleChange} value={fields.minQuantity} placeholder="50"
                  id={COMPONENT_IDS.ADD_SUPPLY_MIN_QUANTITY} disabled={disabled} />
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
          <Button className='submit-button' floated='right' onClick={() => submit(fields, clearForm)} id={COMPONENT_IDS.ADD_SUPPLY_SUBMIT}>Submit</Button>
        </div>
      </Tab.Pane>
    );
  }
  return (<Loader active>Getting data</Loader>);
};

AddSupply.propTypes = {
  names: PropTypes.array.isRequired,
  locations: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
};

/** withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker */
export default withTracker(() => {
  const nameSub = SupplyNames.subscribe();
  const locationSub = Locations.subscribe();
  return {
    names: fetchField(SupplyNames, "supplyName"),
    locations: fetchField(Locations, "location"),
    ready: nameSub.ready() && locationSub.ready(),
  };
})(AddSupply);
