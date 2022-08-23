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
const DispenseSupply = ({ ready, names, sites, dispenseTypes }) => {
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

  const isDisabled = fields.dispenseType !== 'Patient Use';

  // handle qrcode
  useEffect(() => {
    const _id = query.get("_id");
    if (_id && ready) {
      const selector = { stock: { $elemMatch: { _id } } };
      const target = Supplys.findOne(selector)
      // autofill the form with specific supply info
      const { supplyType, supply, isDiscrete } = target;
      const targetSupply = target.stock.find(obj => obj._id === _id);
      const { quantity, donated, donatedBy = "" } = targetSupply;

      const autoFields = { ...initInnerFields, supply, supplyType, isDiscrete, donated, donatedBy, maxQuantity: quantity };
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

  const handleChangeInner = (event, { index, name, value, checked }) => {
    const newInnerFields = [...innerFields];
    newInnerFields[index] = { ...innerFields[index], [name]: value ?? checked };
    setInnerFields(newInnerFields);
  };

  // handle supply, donated select
  const setSupply = (index) => {
    const supply = innerFields[index].supply
    const donated = innerFields[index].donated

    const newInnerFields = [...innerFields]
    const selector = { supply, stock: { $elemMatch: { donated } } }
    const target = Supplys.findOne(selector)
    // if the supply exists:
    if (!!target) {
      const targetLot = target.stock.find(o => o.donated === donated);
      // autofill the form with specific supply info
      const { supplyType, isDiscrete } = target;
      const { quantity, donatedBy = "" } = targetLot;

      newInnerFields[index] = { ...innerFields[index], supplyType, isDiscrete, donatedBy, maxQuantity: quantity }
      setInnerFields(newInnerFields)
    }
  }

  const clearForm = () => {
    setFields(initFields);
    setInnerFields([initInnerFields]);
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
                <DispenseSupplySingle key={`FORM_${index}`} names={names} types={supplyTypes} fields={fields}
                  handleChange={handleChangeInner} setSupply={setSupply} index={index} />
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
  sites: PropTypes.array.isRequired,
  dispenseTypes: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
};

/** withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker */
export default withTracker(() => {
  const nameSub = SupplyNames.subscribe();
  const siteSub = Sites.subscribe();
  const dispenseTypeSub = DispenseTypes.subscribe();
  const supplySub = Supplys.subscribeSupply()

  return {
    names: fetchField(SupplyNames, "supplyName"),
    sites: fetchField(Sites, "site"),
    dispenseTypes: fetchField(DispenseTypes, "dispenseType"),
    ready: nameSub.ready() && siteSub.ready() && dispenseTypeSub.ready() && supplySub.ready(),
  };
})(DispenseSupply);
