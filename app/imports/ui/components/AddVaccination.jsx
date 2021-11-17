import React, { useState } from 'react';
import { Grid, Header, Form, Button, Tab, Loader, Icon } from 'semantic-ui-react';
// import swal from 'sweetalert';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
// import { _ } from 'meteor/underscore';
import { Sites } from '../../api/site/SiteCollection';
import { Locations } from '../../api/location/LocationCollection';
import { COMPONENT_IDS } from '../utilities/ComponentIDs';
// import { allowedUnits } from '../../api/medication/MedicationCollection';

/** On submit, insert the data. */

/** Renders the Page for Dispensing Inventory. */
const AddVaccination = (props) => {
  const [fields, setFields] = useState({
    site: '',
    newSite: '',
    dateAdded: new Date().toLocaleDateString('fr-CA'),
    vaccine: '',
    quantity: '',
    brand: '',
    lotId: '',
    expire: '',
    dispensedFrom: '',
    donorName: '',
    location: '',
    note: '',
    pd: '',
  });

  const handleChange = (event, { name, value }) => {
    setFields({ ...fields, [name]: value });
  };

  if (props.ready) {
    return (
      <Tab.Pane id={COMPONENT_IDS.ADD_FORM}>
        <Header as="h2">
          <Header.Content>
              Add Vaccine to Inventory Form
            <Header.Subheader>
              <i>Please input all relative fields to add a vaccine to the inventory</i>
            </Header.Subheader>
          </Header.Content>
        </Header>
        <Form>
          <Grid columns='equal' stackable>
            <Grid.Row>
              <Grid.Column>
                <Form.Select clearable search label='Vaccine Name'
                  placeholder=" J&J COVID" name='vaccine'
                  value={fields.drug} allowAdditions/>
              </Grid.Column>
              <Grid.Column className='filler-column' />
              <Grid.Column className='filler-column' />
            </Grid.Row>
            <Grid.Row>
              {/* TODO: expand drug type column */}
              <Grid.Column>
                <Form.Select clearable search label='Manufacturer'
                  placeholder="ACAM2000 Sanofi Pasteur"
                  name='brand' onChange={handleChange}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Select clearable search label='Lot Number'
                  placeholder="Z9Z99" name='lotId'
                  value={fields.lotId} allowAdditions/>
              </Grid.Column>
              <Grid.Column>
                <Form.Input label='Minimum Quantity' type='number' min={1} name='minQuantity' className='quantity'
                  onChange={handleChange} value={fields.minQuantity} placeholder="100"/>
              </Grid.Column>
              <Grid.Column className='filler-column' />
            </Grid.Row>
            <Grid.Row>
              <Grid.Column>
                {/* expiration date may be null */}
                <Form.Field>
                  <label>Expiration Date</label>
                  <Form.Input type='date' name='expire' onChange={handleChange} value={fields.expire}/>
                  <Icon name='x' className='x-icon' onClick={() => setFields({ ...fields, expire: '' })}
                    style={{ visibility: fields.expire ? 'visible' : 'hidden' }}/>
                </Form.Field>
              </Grid.Column>
              <Grid.Column>
                <Form.Select compact clearable search label='Location'
                  placeholder="Case 2" name='location'
                  onChange={handleChange} value={fields.location} id={COMPONENT_IDS.ADD_MEDICATION_LOCATION}/>
              </Grid.Column>
              <Grid.Column>
                <Form.Input label='Quantity' type='number' min={1} name='quantity'
                  onChange={handleChange} value={fields.quantity} placeholder="200"/>
              </Grid.Column>
              <Grid.Column className='checkbox-column'>
                <Form.Checkbox label='Donated' name='donated' onChange={handleChange} checked={fields.donated}/>
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
          <Button className='clear-button' id={COMPONENT_IDS.ADD_VACCINATION_CLEAR}>Clear Fields</Button>
          <Button className='submit-button' floated='right' // onClick={() => validateForm(fields)}
            id={COMPONENT_IDS.ADD_VACCINATION_SUBMIT}>Submit</Button>
        </div>
      </Tab.Pane>
    );
  }
  return (<Loader active>Getting data</Loader>);
};

/** Require an array of Stuff documents in the props. */
AddVaccination.propTypes = {
  currentUser: PropTypes.object,
  sites: PropTypes.array.isRequired,
  drugs: PropTypes.array.isRequired,
  lotIds: PropTypes.array.isRequired,
  locations: PropTypes.array.isRequired,
  brands: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
};

/** withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker */
export default withTracker(() => {
  const siteSub = Sites.subscribeSite();
  const locationSub = Locations.subscribeLocation();
  return {
    currentUser: Meteor.user(),
    sites: Sites.find({}).fetch(),
    locations: Locations.find({}).fetch(),
    ready: siteSub.ready() && locationSub.ready(),
  };
})(AddVaccination);
