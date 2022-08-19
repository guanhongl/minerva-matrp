import React, { useState, useEffect } from 'react';
import { Grid, Header, Form, Button, Tab, Loader, Dropdown } from 'semantic-ui-react';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
import swal from 'sweetalert';
import moment from 'moment';
import { Supplys } from '../../../api/supply/SupplyCollection';
import { SupplyNames } from '../../../api/supplyName/SupplyNameCollection';
import { Locations } from '../../../api/location/LocationCollection';
import { Sites } from '../../../api/site/SiteCollection';
import { supplyTypes } from '../../../api/supply/SupplyCollection';
import { DispenseTypes } from '../../../api/dispense-type/DispenseTypeCollection';
import { fetchField, getOptions, useQuery } from '../../utilities/Functions';
import { dispenseMethod } from '../../../api/supply/SupplyCollection.methods';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import DispenseSupplySingle from './DispenseSupplySingle';

/** handle submit for Dispense Supply. */
const submit = (fields, innerFields, callback) => {
  dispenseMethod.callPromise({ fields, innerFields })
    .then(success => {
      swal('Success', success, 'success', { buttons: false, timer: 3000 });
      callback(); // resets the form
    })
    .catch(err => swal("Error", err.message, "error"));
};

/** Renders the Page for Dispensing Supply. */
const DispenseSupply = ({ ready, names, locations, sites, dispenseTypes }) => {
  const query = useQuery();
  const initFields = {
    inventoryType: 'Supply',
    dispenseType: 'Patient Use',
    dateDispensed: moment().format('YYYY-MM-DDTHH:mm'),
    dispensedTo: '',
    site: '',
    note: '',
  };
  const initInnerFields = {
    supply: '',
    supplyType: '',
    location: '', // to find supply
    donated: false,
    donatedBy: '',
    quantity: '',
    maxQuantity: 0,
    isDiscrete: true,
  };

  const [fields, setFields] = useState(initFields);
  const [innerFields, setInnerFields] = useState(
    JSON.parse(sessionStorage.getItem("supplyFields")) ?? [initInnerFields]
  );
  // const [maxQuantity, setMaxQuantity] = useState(0);
  // const [filteredLocations, setFilteredLocations] = useState([]);
  // useEffect(() => {
  //   setFilteredLocations(locations);
  // }, [locations]);

  const isDisabled = fields.dispenseType !== 'Patient Use';

  useEffect(() => {
    const _id = query.get("_id");
    if (_id && ready) {
      const selector = { stock: { $elemMatch: { _id } } };
      const target = Supplys.findOne(selector)
      // autofill the form with specific supply info
      const { supplyType, supply, isDiscrete } = target;

      const targetSupply = target.stock.find(obj => obj._id === _id);
      const { quantity, donated, donatedBy = "", location } = targetSupply;

      // const autoFields = { ...fields, supply, location, supplyType, donated, donatedBy };
      // setFields(autoFields);
      // setMaxQuantity(quantity);

      const autoFields = { ...initInnerFields, supply, supplyType, isDiscrete, location, donated, donatedBy, maxQuantity: quantity };
      // setInnerFields([autoFields]);
      // append the first field if its name is not empty
      const newInnerFields = innerFields[0].supply ?
        [...innerFields, autoFields] : [autoFields];
      setInnerFields(newInnerFields);
      sessionStorage.setItem("supplyFields", JSON.stringify(newInnerFields));
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

  const handleChangeInner = (event, { index, name, value }) => {
    const newInnerFields = [...innerFields];
    newInnerFields[index] = { ...innerFields[index], [name]: value };
    setInnerFields(newInnerFields);
  };

  const handleCheck = (event, { index, name, checked }) => {
    const newInnerFields = [...innerFields];
    if (!checked) {
      newInnerFields[index] = { ...innerFields[index], [name]: checked, donatedBy: '' };
    } else {
      newInnerFields[index] = { ...innerFields[index], [name]: checked };
    }
    setInnerFields(newInnerFields);
  };

  // handle supply select; filter locations
  // const onSupplySelect = (event, { value: supply }) => {
  //   findOneMethod.callPromise({ collectionName, selector: { supply } })
  //     .then(target => {
  //       // if supply is not empty:
  //       if (!!target) {
  //         setFields({ ...fields, supply });
  //         setFilteredLocations(_.uniq(_.pluck(target.stock, 'location')).sort());
  //       } else {
  //         // else reset specific supply info
  //         setFields({ ...fields, supply });
  //         setFilteredLocations(locations);
  //       }
  //     });
  // };

  // autofill form if supply, location, donated are selected
  // useEffect(() => {
  //   if (fields.supply && fields.location) {
  //     const selector = { supply: fields.supply, stock: { $elemMatch: { location: fields.location, donated: fields.donated } } };
  //     findOneMethod.callPromise({ collectionName, selector })
  //       .then(target => {
  //         // if supply w/ name, location, donated exists:
  //         if (!!target) {
  //           // autofill the form with specific supply info
  //           const { supplyType } = target;

  //           targetSupply = target.stock.find(obj => obj.location === fields.location && obj.donated === fields.donated);
  //           const { quantity, donatedBy } = targetSupply;

  //           const autoFields = { ...fields, supplyType, donatedBy };
  //           setFields(autoFields);

  //           setMaxQuantity(quantity);
  //         } else {
  //           setFields({ ...fields, supplyType: '', donatedBy: '' });
  //           setMaxQuantity(0);
  //         }
  //       });
  //   }
  // }, [fields.supply, fields.location, fields.donated]);

  const handleSelect = (obj, index) => {
    const newInnerFields = [...innerFields];
    newInnerFields[index] = { ...innerFields[index], ...obj };
    setInnerFields(newInnerFields);
  };

  const clearForm = () => {
    setFields(initFields);
    setInnerFields([initInnerFields]);
    // setMaxQuantity(0);
    // setFilteredLocations(locations);
    sessionStorage.removeItem("supplyFields");
  };

  // handle add new vaccine to dispense
  const onAdd = () => {
    const newInnerFields = [...innerFields];
    newInnerFields.push(initInnerFields);
    setInnerFields(newInnerFields);
  };

  // handle remove vaccine to dispense
  const onRemove = () => {
    const newInnerFields = [...innerFields];
    newInnerFields.pop();
    setInnerFields(newInnerFields);
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

            {
              innerFields.map((fields, index) => 
                <DispenseSupplySingle key={`FORM_${index}`} names={names} locations={locations} types={supplyTypes} fields={fields}
                  handleChange={handleChangeInner} handleCheck={handleCheck} handleSelect={handleSelect} index={index} />
              )
            }

            <Grid.Row style={{ padding: 0 }}>
              <Grid.Column style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {
                  innerFields.length !== 1 &&
                  <Button className='remove-item' compact icon='minus' content='Remove Supply' size='mini' onClick={onRemove}/>
                }
                <Button className='add-item' compact icon='add' content='Add New Supply' size='mini' onClick={onAdd} />
              </Grid.Column>
            </Grid.Row>

            {/* <Grid.Row>
              <Grid.Column>
                <Form.Select clearable search label='Supply Name' options={getOptions(names)}
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
            </Grid.Row> */}
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
          <Button className='submit-button' floated='right' onClick={() => submit(fields, innerFields, clearForm)}>Submit</Button>
          {/* <Button className='submit-button' floated='right' onClick={() => alert('Under Maintenance...')}>Submit</Button> */}
        </div>
      </Tab.Pane>
    );
  }
  return (<Loader active>Getting data</Loader>);
};

DispenseSupply.propTypes = {
  names: PropTypes.array.isRequired,
  locations: PropTypes.array.isRequired,
  sites: PropTypes.array.isRequired,
  dispenseTypes: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
};

/** withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker */
export default withTracker(() => {
  const nameSub = SupplyNames.subscribe();
  const locationSub = Locations.subscribe();
  const siteSub = Sites.subscribe();
  const dispenseTypeSub = DispenseTypes.subscribe();
  const supplySub = Supplys.subscribeSupplyLots()

  return {
    names: fetchField(SupplyNames, "supplyName"),
    locations: Locations.find({}, { sort: { location: 1 } }).fetch(),
    sites: fetchField(Sites, "site"),
    dispenseTypes: fetchField(DispenseTypes, "dispenseType"),
    ready: nameSub.ready() && locationSub.ready() && siteSub.ready() && dispenseTypeSub.ready() && supplySub.ready(),
  };
})(DispenseSupply);
