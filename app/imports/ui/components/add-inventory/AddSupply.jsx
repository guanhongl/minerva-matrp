import React, { useEffect, useState, useMemo } from 'react';
import { Grid, Header, Form, Button, Tab, Loader } from 'semantic-ui-react';
import swal from 'sweetalert';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { Supplys } from '../../../api/supply/SupplyCollection';
import { supplyTypes } from '../../../api/supply/SupplyCollection';
import { SupplyNames } from '../../../api/supplyName/SupplyNameCollection';
import { Locations } from '../../../api/location/LocationCollection';
import { addMethod } from '../../../api/supply/SupplyCollection.methods';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { fetchField, getOptions, getLocations, printQRCode } from '../../utilities/Functions';

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
  const initialState = {
    supply: '',
    supplyType: '',
    minQuantity: '',
    quantity: '',
    location: [],
    note: '',
    donated: false,
    donatedBy: '',
    isDiscrete: true,
  };

  const [fields, setFields] = useState(initialState);
  // disable supply type and minimum if the supply is populated. 
  // assuming a supply cannot have 1+ types
  const disabled = useMemo(() => {
    const record = Supplys.findOne({ supply: fields.supply })

    return !!record
  }, [fields.supply])

  // handles supply select
  // autofill location, donated by, and note on (supply, donated) select
  useEffect(() => {
    const selector = { supply: fields.supply, stock: { $elemMatch: { donated: fields.donated } } }
    const target = Supplys.findOne(selector)
    // if the supply exists:
    if (!!target) {
      const targetLot = target.stock.find(o => o.donated === fields.donated);
      // autofill the form with specific supply info
      const { supplyType, minQuantity, isDiscrete } = target;
      const { location, donatedBy = "", note = "" } = targetLot;
      const autoFields = { ...fields, supplyType, minQuantity, isDiscrete, location, donatedBy, note }
      setFields(autoFields)
    } 
  }, [fields.supply, fields.donated]);

  const handleChange = (event, { name, value, checked }) => {
    setFields({ ...fields, [name]: value ?? checked });
  };

  // handle donated check
  // useEffect(() => {
  //   if (!fields.donated) {
  //     setFields({ ...fields, donatedBy: "" })
  //   }
  // }, [fields.donated])

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
                  placeholder="Hot Packs" name='supply' onChange={handleChange} value={fields.supply} id={COMPONENT_IDS.ADD_SUPPLY_NAME} />
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
                  id={COMPONENT_IDS.ADD_SUPPLY_MIN_QUANTITY} disabled={disabled || !fields.isDiscrete} />
              </Grid.Column>
              <Grid.Column>
                <Form.Field>
                  <label>Has Quantity</label>
                  <Form.Checkbox name="isDiscrete" onChange={handleChange} checked={fields.isDiscrete} disabled={disabled} />
                </Form.Field>
              </Grid.Column>
            </Grid.Row>

            <Grid.Row>
              <Grid.Column>
                <Form.Input label='Quantity' type='number' min={1} name='quantity' placeholder='10' disabled={!fields.isDiscrete}
                  onChange={handleChange} value={fields.quantity} id={COMPONENT_IDS.ADD_SUPPLY_QUANTITY} />
              </Grid.Column>
              <Grid.Column>
                <Form.Select clearable multiple search label='Location' options={getLocations(locations)} placeholder='Cabinet 1'
                  name='location' onChange={handleChange} value={fields.location} id={COMPONENT_IDS.ADD_SUPPLY_LOCATION}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Field>
                  <label>Donated</label>
                  <Form.Group>
                    <Form.Checkbox name='donated' className='donated-field'
                      onChange={handleChange} checked={fields.donated}/>
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
  const supplySub = Supplys.subscribeSupply()

  return {
    names: fetchField(SupplyNames, "supplyName"),
    locations: Locations.find({}, { sort: { location: 1 } }).fetch(),
    ready: nameSub.ready() && locationSub.ready() && supplySub.ready(),
  };
})(AddSupply);
