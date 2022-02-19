import React, { useState, useEffect } from 'react';
import { Grid, Header, Form, Button, Tab, Loader, Dropdown } from 'semantic-ui-react';
import swal from 'sweetalert';
import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { Vaccinations } from '../../api/vaccination/VaccinationCollection';
import { Sites } from '../../api/site/SiteCollection';
import { dispenseTypes } from '../../api/historical/HistoricalCollection';
import { defineMethod, updateMethod } from '../../api/base/BaseCollection.methods';
import { distinct, getOptions, nestedDistinct } from '../utilities/Functions';

/** handle submit for Dispense Vaccine. */
const submit = (data, callback) => {
  const { inventoryType, dispenseType, dateDispensed, dispensedFrom, dispensedTo, site, vaccine, lotId, brand, expire, dose, visDate, note } = data;
  const collectionName = Vaccinations.getCollectionName();
  const targetVaccine = Vaccinations.findOne({ vaccine, brand }); // find the existing vaccine; vaccines are uniquely identified by (vaccine, brand)
  const { _id, lotIds } = targetVaccine;
  const targetIndex = lotIds.findIndex((obj => obj.lotId === lotId)); // find the index of existing the lotId
  const { quantity } = lotIds[targetIndex];

  // assume dispense only dispenses 1 at a time
  // TODO: think about what happens when multiple ppl dispense at a time
  // if quantity > 1
  if (quantity > 1) {
    lotIds[targetIndex].quantity -= 1; // decrement the quantity
  } else {
    // else if quantity === 1
    lotIds.splice(targetIndex, 1); // remove the lotId
  }
  const updateData = { id: _id, lotIds };
  const element = { lotId, brand, expire, dose, visDate };
  const definitionData = { inventoryType, dispenseType, dateDispensed, dispensedFrom, dispensedTo, site,
    name: vaccine, note, element };
  // TODO: fix promises
  const promises = [
    updateMethod.callPromise({ collectionName, updateData }),
    defineMethod.callPromise({ collectionName: 'HistoricalsCollection', definitionData }),
  ];
  Promise.allSettled(promises)
    .then(() => {
      swal('Success', `${vaccine}, ${lotId} updated successfully`, 'success', { buttons: false, timer: 3000 });
      callback(); // resets the form
    })
    .catch(error => swal('Error', error.message, 'error'));
};

/** validates the dispense vaccine form */
const validateForm = (data, callback) => {
  const submitData = { ...data, dispensedFrom: Meteor.user().username };

  if (data.dispenseType !== 'Patient Use') { // handle non patient use dispense
    submitData.dispensedTo = '-';
    submitData.site = '-';
  }

  let errorMsg = '';
  // the required String fields
  const requiredFields = ['dispensedTo', 'site', 'vaccine', 'lotId', 'brand', 'visDate', 'dose'];

  // check required fields
  requiredFields.forEach(field => {
    if (!submitData[field]) {
      errorMsg += `${field} cannot be empty.\n`;
    }
  });

  if (errorMsg) {
    swal('Error', `${errorMsg}`, 'error');
  } else {
    submitData.dose = parseInt(data.dose, 10);
    submit(submitData, callback);
  }
};

/** Renders the Page for Dispensing Vaccine. */
const DispenseVaccination = ({ ready, vaccines, brands, lotIds, sites }) => {
  const [fields, setFields] = useState({
    inventoryType: 'Vaccine',
    dispenseType: 'Patient Use',
    dateDispensed: moment().format('YYYY-MM-DDTHH:mm'),
    dispensedTo: '',
    site: '',
    vaccine: '',
    lotId: '',
    brand: '',
    expire: '',
    dose: '', // the dose number; should always dispense only 1
    visDate: '',
    note: '',
  });
  // const [maxQuantity, setMaxQuantity] = useState(0);
  const isDisabled = fields.dispenseType !== 'Patient Use';

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

  // handle lotId select
  const onLotIdSelect = (event, { value: lotId }) => {
     const target = Vaccinations.findOne({ lotIds: { $elemMatch: { lotId } } });
    // if lotId is not empty:
    if (target) {
      // autofill the form with specific lotId info
      const targetLotId = target.lotIds.find(obj => obj.lotId === lotId);
      const { vaccine, brand, minQuantity, visDate } = target;
      const { expire, quantity } = targetLotId;
      const autoFields = { ...fields, lotId, vaccine, brand, minQuantity, visDate, expire };
      setFields(autoFields);
      // setMaxQuantity(quantity);
    } else {
      // else reset specific lotId info
      setFields({ ...fields, lotId, vaccine: '', brand: '', minQuantity: '', visDate: '', expire: '' });
      // setMaxQuantity(0);
    }
  };

  const clearForm = () => {
    setFields({ ...fields, dispenseType: 'Patient Use', dispensedTo: '', site: '', vaccine: '',
      lotId: '', brand: '', expire: '', dose: '', visDate: '', note: '' });
    // setMaxQuantity(0);
  };

  if (ready) {
    return (
      <Tab.Pane id='dispense-form'>
        <Header as="h2">
          <Header.Content>
            <Dropdown inline name='dispenseType' options={getOptions(dispenseTypes)}
              onChange={handleChange} value={fields.dispenseType} />
            Dispense from Vaccine Inventory Form
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
                  name='dispensedTo' onChange={handleChange} value={fields.dispensedTo} disabled={isDisabled}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Select clearable search label='Site' options={getOptions(sites)}
                  placeholder="Kaka’ako" name='site'
                  onChange={handleChange} value={fields.site} disabled={isDisabled}/>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                <Form.Select clearable search label='Lot Number' options={getOptions(lotIds)}
                  placeholder="Z9Z99" name='lotId' value={fields.lotId} onChange={onLotIdSelect} />
              </Grid.Column>
              <Grid.Column>
                <Form.Select clearable search label='Vaccine' options={getOptions(vaccines)}
                  placeholder="J&J COVID" name='vaccine' value={fields.vaccine} onChange={handleChange} />
              </Grid.Column>
              <Grid.Column>
                <Form.Select clearable search label='Manufacturer' options={getOptions(brands)}
                  placeholder="ACAM2000 Sanofi Pasteur" name='brand' value={fields.brand} onChange={handleChange}/>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                {/* expiration date may be null */}
                <Form.Input type='date' label='Expiration Date' name='expire'
                  onChange={handleChange} value={fields.expire}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Group>
                  <Form.Input type="date" label='VIS Date' name='visDate' className='quantity'
                    onChange={handleChange} value={fields.visDate} />
                  <Form.Input label='Dose #' type='number' min={1} name='dose' className='unit'
                    onChange={handleChange} placeholder='1' />
                </Form.Group>
              </Grid.Column>
              <Grid.Column className='filler-column' />
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
          {/* <Button className='submit-button' floated='right' onClick={() => alert('Under Maintenance...')}>Submit</Button> */}
        </div>
      </Tab.Pane>
    );
  }
  return (<Loader active>Getting data</Loader>);
};

DispenseVaccination.propTypes = {
  sites: PropTypes.array.isRequired,
  vaccines: PropTypes.array.isRequired,
  lotIds: PropTypes.array.isRequired,
  brands: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
};

/** withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker */
export default withTracker(() => {
  const vaccineSub = Vaccinations.subscribeVaccination();
  const siteSub = Sites.subscribeSite();
  return {
    sites: distinct('site', Sites),
    vaccines: distinct('vaccine', Vaccinations),
    brands: distinct('brand', Vaccinations),
    lotIds: nestedDistinct('lotId', Vaccinations),
    ready: vaccineSub.ready() && siteSub.ready(),
  };
})(DispenseVaccination);
