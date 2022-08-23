import React, { useState, useEffect } from 'react';
import { Grid, Header, Form, Button, Tab, Loader, Dropdown } from 'semantic-ui-react';
import swal from 'sweetalert';
import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { Vaccines } from '../../../api/vaccine/VaccineCollection';
import { VaccineNames } from '../../../api/vaccineName/VaccineNameCollection';
import { VaccineBrands } from '../../../api/vaccineBrand/VaccineBrandCollection';
import { Sites } from '../../../api/site/SiteCollection';
import { DispenseTypes } from '../../../api/dispense-type/DispenseTypeCollection';
import { dispenseMethod } from '../../../api/vaccine/VaccineCollection.methods';
import { fetchField, fetchLots, getOptions, useQuery } from '../../utilities/Functions';
import DispenseVaccineSingle from './DispenseVaccineSingle';

/** handle submit for Dispense Vaccine. */
const submit = (fields, innerFields, callback) => {
  dispenseMethod.callPromise({ fields, innerFields })
    .then(success => {
      swal('Success', success, 'success', { buttons: false, timer: 3000 });
      callback(); // resets the form
    })
    .catch(err => swal("Error", err.message, "error"));
};

/** Renders the Page for Dispensing Vaccine. */
const DispenseVaccine = ({ ready, names, brands, lotIds, sites, dispenseTypes }) => {
  const query = useQuery();
  const initFields = {
    inventoryType: 'Vaccine',
    dispenseType: 'Patient Use',
    dateDispensed: moment().format('YYYY-MM-DDTHH:mm'),
    dispensedTo: '',
    site: '',
    note: '',
  };
  const initInnerFields = {
    vaccine: '',
    lotId: '',
    brand: '',
    expire: '',
    dose: '', // the dose number
    quantity: '',
    visDate: '',
    donated: false,
    donatedBy: '',
    maxQuantity: 0,
  };

  const [fields, setFields] = useState(initFields);
  const [innerFields, setInnerFields] = useState(
    JSON.parse(sessionStorage.getItem("vaccineFields")) ?? [initInnerFields]
  );
  const patientUse = fields.dispenseType === 'Patient Use';
  const nonPatientUse = fields.dispenseType !== 'Patient Use';

  // handle qrcode
  useEffect(() => {
    const _id = query.get("_id");
    if (_id && ready) {
      const selector = { lotIds: { $elemMatch: { _id } } };
      const target = Vaccines.findOne(selector)
      // autofill the form with specific lotId info
      const targetLotId = target.lotIds.find(obj => obj._id === _id);
      const { vaccine, visDate } = target;
      const { brand, expire = "", lotId, quantity, donated, donatedBy = "" } = targetLotId;
      const autoFields = { ...initInnerFields, vaccine, lotId, brand, expire, visDate, donated, donatedBy, maxQuantity: quantity };
      // setInnerFields([autoFields]);
      // append the first field if its lot is not empty
      const newInnerFields = innerFields[0].lotId ?
        [...innerFields, autoFields] : [autoFields];
      setInnerFields(newInnerFields);
      sessionStorage.setItem("vaccineFields", JSON.stringify(newInnerFields));
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

  // handle donated check
  const setDonatedBy = (index) => {
    const newInnerFields = [...innerFields]
    newInnerFields[index] = { ...innerFields[index], donatedBy: '' }
    setInnerFields(newInnerFields)
  }

  // handle lotId select
  const setLotId = (index) => {
    const lotId = innerFields[index].lotId
    const newInnerFields = [...innerFields];
    const selector = { lotIds: { $elemMatch: { lotId } } };
    const target = Vaccines.findOne(selector)
    // if lotId is not empty:
    if (!!target) {
      // autofill the form with specific lotId info
      const targetLotId = target.lotIds.find(obj => obj.lotId === lotId);
      const { vaccine, visDate } = target;
      const { brand, expire = "", quantity, donated, donatedBy = "" } = targetLotId;
      newInnerFields[index] = { ...innerFields[index], vaccine, brand, expire, visDate, donated, donatedBy, maxQuantity: quantity };
      setInnerFields(newInnerFields);
    } else {
      // else reset specific lotId info
      newInnerFields[index] = { ...innerFields[index], vaccine: '', brand: '', expire: '', visDate: '', 
        donated: false, donatedBy: '', maxQuantity: 0 };
      setInnerFields(newInnerFields);
    }
  };

  const clearForm = () => {
    setFields(initFields);
    setInnerFields([initInnerFields]);
    sessionStorage.removeItem("vaccineFields");
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
            Dispense from Vaccines Inventory Form
            <Header.Subheader>
              <i>Please input the following information to dispense from the inventory,
                to the best of your abilities.</i>
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
                  name='dispensedTo' onChange={handleChange} value={fields.dispensedTo} disabled={nonPatientUse}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Select clearable search label='Site' options={getOptions(sites)}
                  placeholder="Kaka’ako" name='site'
                  onChange={handleChange} value={fields.site} disabled={nonPatientUse}/>
              </Grid.Column>
            </Grid.Row>

            {
              innerFields.map((fields, index) => 
                <DispenseVaccineSingle key={`FORM_${index}`} names={names} lotIds={lotIds} brands={brands} fields={fields}
                  handleChange={handleChangeInner} setDonatedBy={setDonatedBy} setLotId={setLotId}
                  index={index} patientUse={patientUse} nonPatientUse={nonPatientUse} />
              )
            }

            <Grid.Row style={{ padding: 0 }}>
              <Grid.Column style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {
                  innerFields.length !== 1 &&
                  <Button className='remove-item' compact icon='minus' content='Remove Vaccine' size='mini' onClick={onRemove}/>
                }
                <Button className='add-item' compact icon='add' content='Add New Vaccine' size='mini' onClick={onAdd} />
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
          <Button className='submit-button' floated='right' onClick={() => submit(fields, innerFields, clearForm)}>Submit</Button>
          {/* <Button className='submit-button' floated='right' onClick={() => alert('Under Maintenance...')}>Submit</Button> */}
        </div>
      </Tab.Pane>
    );
  }
  return (<Loader active>Getting data</Loader>);
};

DispenseVaccine.propTypes = {
  names: PropTypes.array.isRequired,
  brands: PropTypes.array.isRequired,
  lotIds: PropTypes.array.isRequired,
  sites: PropTypes.array.isRequired,
  dispenseTypes: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
};

/** withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker */
export default withTracker(() => {
  const nameSub = VaccineNames.subscribe();
  const brandSub = VaccineBrands.subscribe();
  const siteSub = Sites.subscribe();
  const dispenseTypeSub = DispenseTypes.subscribe();
  const vaccineSub = Vaccines.subscribeVaccine()

  return {
    names: fetchField(VaccineNames, "vaccineName"),
    brands: fetchField(VaccineBrands, "vaccineBrand"),
    lotIds: fetchLots(Vaccines),
    sites: fetchField(Sites, "site"),
    dispenseTypes: fetchField(DispenseTypes, "dispenseType"),
    ready: nameSub.ready() && brandSub.ready() && vaccineSub.ready() && siteSub.ready() && dispenseTypeSub.ready(),
  };
})(DispenseVaccine);
