import React, { useState, useEffect } from 'react';
import { Grid, Header, Form, Button, Tab, Loader, Dropdown } from 'semantic-ui-react';
import swal from 'sweetalert';
import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { Sites } from '../../../api/site/SiteCollection';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { Drugs } from '../../../api/drug/DrugCollection';
import { DrugNames } from '../../../api/drugName/DrugNameCollection';
import { DrugBrands } from '../../../api/drugBrand/DrugBrandCollection';
import { Units } from '../../../api/unit/UnitCollection';
import { DispenseTypes } from '../../../api/dispense-type/DispenseTypeCollection';
import { dispenseMethod } from '../../../api/drug/DrugCollection.methods';
import { fetchField, fetchLots, getOptions, useQuery } from '../../utilities/Functions';
import DispenseDrugSingle from './DispenseDrugSingle';

/** handle submit for Dispense Medication. */
const submit = (fields, innerFields, callback) => {
  dispenseMethod.callPromise({ fields, innerFields })
    .then(success => {
      swal('Success', success, 'success', { buttons: false, timer: 3000 });
      callback(); // resets the form
    })
    .catch(err => swal("Error", err.message, "error"));
};

/** Renders the Page for Dispensing Medication. */
const DispenseDrug = ({ ready, names, units, brands, lotIds, sites, dispenseTypes }) => {
  const query = useQuery();
  const initFields = {
    site: '',
    dateDispensed: moment().format('YYYY-MM-DDTHH:mm'),
    dispensedTo: '',
    inventoryType: 'Drug',
    dispenseType: 'Patient Use',
    note: '',
  };
  const initInnerFields = {
    lotId: '',
    drug: '',
    brand: '',
    expire: '',
    quantity: '',
    unit: 'tab(s)',
    donated: false,
    donatedBy: '',
    maxQuantity: 0,
  };

  const [fields, setFields] = useState(initFields);
  const [innerFields, setInnerFields] = useState(
    JSON.parse(sessionStorage.getItem("drugFields")) ?? [initInnerFields]
  );
  const isDisabled = fields.dispenseType !== 'Patient Use';

  useEffect(() => {
    const _id = query.get("_id");
    if (_id && ready) {
      const selector = { lotIds: { $elemMatch: { _id } } };
      const target = Drugs.findOne(selector)
      // autofill the form with specific lotId info
      const targetLotId = target.lotIds.find(obj => obj._id === _id);
      const { drug, unit } = target;
      const { brand = "", expire = "", quantity, donated, donatedBy = "", lotId } = targetLotId;
      const newInnerField = { ...initInnerFields, lotId, drug, expire, brand, unit, donated, donatedBy,
        maxQuantity: quantity };
      // setInnerFields([newInnerField]);
      // append the first field if its lot is not empty
      const newInnerFields = innerFields[0].lotId ?
        [...innerFields, newInnerField] : [newInnerField];
      setInnerFields(newInnerFields);
      sessionStorage.setItem("drugFields", JSON.stringify(newInnerFields));
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

  // handle lotId select
  const onLotIdSelect = (event, { index, value: lotId }) => {
    const newInnerFields = [...innerFields];
    const selector = { lotIds: { $elemMatch: { lotId } } };
    const target = Drugs.findOne(selector)
    // if lotId is not empty:
    if (!!target) {
      // autofill the form with specific lotId info
      const targetLotId = target.lotIds.find(obj => obj.lotId === lotId);
      const { drug, unit } = target;
      const { brand = "", expire = "", quantity, donated, donatedBy = "" } = targetLotId;
      newInnerFields[index] = { ...innerFields[index], lotId, drug, expire, brand, unit, donated, donatedBy,
        maxQuantity: quantity };
      setInnerFields(newInnerFields);
    } else {
      // else reset specific lotId info
      newInnerFields[index] = { ...innerFields[index], lotId, drug: '', expire: '', brand: '', unit: 'tab(s)',
        donated: false, donatedBy: '', maxQuantity: 0 };
      setInnerFields(newInnerFields);
    }
  };

  // handle add new drug to dispense
  const onAddDrug = () => {
    const newInnerFields = [...innerFields];
    newInnerFields.push(initInnerFields);
    setInnerFields(newInnerFields);
  };

  // handle remove drug to dispense
  const onRemoveDrug = () => {
    const newInnerFields = [...innerFields];
    newInnerFields.pop();
    setInnerFields(newInnerFields);
  };

  const clearForm = () => {
    setFields(initFields);
    setInnerFields([initInnerFields]);
    sessionStorage.removeItem("drugFields");
  };

  if (ready) {
    return (
      <Tab.Pane id='dispense-form'>
        <Header as="h2">
          <Header.Content>
            <Dropdown inline name='dispenseType' options={getOptions(dispenseTypes)}
              onChange={handleChange} value={fields.dispenseType} />
              Dispense from Drugs Inventory Form
            <Header.Subheader>
              <i>Please input the following information to dispense from the inventory, to the best of your abilities.</i>
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
                <Form.Input label='Dispensed To' placeholder="Patient Number" disabled={isDisabled}
                  name='dispensedTo' onChange={handleChange} value={fields.dispensedTo} id={COMPONENT_IDS.DISPENSE_MED_PT_NUM}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Select clearable search label='Site' options={getOptions(sites)} disabled={isDisabled}
                  placeholder="Kaka’ako" name='site'
                  onChange={handleChange} value={fields.site}/>
              </Grid.Column>
            </Grid.Row>
            {
              innerFields.map((innerField, index) => 
                <DispenseDrugSingle names={names} units={units} brands={brands} lotIds={lotIds} fields={innerField}
                  handleChange={handleChangeInner} handleCheck={handleCheck} onLotIdSelect={onLotIdSelect}
                  index={index} key={`FORM_${index}`} />,
              )
            }
            <Grid.Row style={{ padding: 0 }}>
              <Grid.Column style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {
                  innerFields.length !== 1 &&
                  <Button className='remove-item' compact icon='minus' content='Remove Drug' size='mini' onClick={onRemoveDrug}/>
                }
                <Button className='add-item' compact icon='add' content='Add New Drug' size='mini' onClick={onAddDrug} />
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.TextArea label='Additional Notes' name='note' onChange={handleChange} value={fields.note}
                  placeholder="Please add any additional notes, special instructions, or information that should be known here."
                  id={COMPONENT_IDS.DISPENSE_MED_NOTES}/>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Form>
        <div className='buttons-div'>
          <Button className='clear-button' onClick={clearForm} id={COMPONENT_IDS.DISPENSE_MED_CLEAR}>Clear Fields</Button>
          <Button className='submit-button' floated='right' onClick={() => submit(fields, innerFields, clearForm)}>Submit</Button>
        </div>
      </Tab.Pane>
    );
  }
  return (<Loader active>Getting data</Loader>);
};

/** Require an array of ... in the props. */
DispenseDrug.propTypes = {
  names: PropTypes.array.isRequired,
  units: PropTypes.array.isRequired,
  brands: PropTypes.array.isRequired,
  lotIds: PropTypes.array.isRequired,
  sites: PropTypes.array.isRequired,
  dispenseTypes: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
};

/** withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker */
export default withTracker(() => {
  const nameSub = DrugNames.subscribe();
  const unitSub = Units.subscribe();
  const brandSub = DrugBrands.subscribe();
  const siteSub = Sites.subscribe();
  const dispenseTypeSub = DispenseTypes.subscribe();
  const drugSub = Drugs.subscribeDrugLots()

  return {
    names: fetchField(DrugNames, "drugName"),
    units: fetchField(Units, "unit"),
    brands: fetchField(DrugBrands, "drugBrand"),
    lotIds: fetchLots(Drugs),
    sites: fetchField(Sites, "site"),
    dispenseTypes: fetchField(DispenseTypes, "dispenseType"),
    ready: nameSub.ready() && unitSub.ready() && brandSub.ready() && drugSub.ready() && siteSub.ready() && dispenseTypeSub.ready(),
  };
})(DispenseDrug);
