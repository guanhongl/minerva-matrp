import React from 'react';
import { Grid, Form } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { getOptions } from '../../utilities/Functions';

const DispenseVaccineSingle = ({ names, lotIds, brands, fields, 
  handleChange, onLotIdSelect, index, patientUse, nonPatientUse }) => (
  // return (
  <>
    <Grid.Row className="dispense-single">
      <Grid.Column>
        <Form.Select clearable search label='Lot Number' options={getOptions(lotIds)}
          placeholder="Z9Z99" name='lotId' value={fields.lotId} onChange={onLotIdSelect} index={index} />
      </Grid.Column>
      <Grid.Column>
        <Form.Select clearable search label='Vaccine' options={getOptions(names)}
          placeholder="J&J COVID" name='vaccine' value={fields.vaccine} onChange={handleChange} index={index} />
      </Grid.Column>
      <Grid.Column>
        <Form.Select clearable search label='Manufacturer' options={getOptions(brands)}
          placeholder="ACAM2000 Sanofi Pasteur" name='brand' value={fields.brand} onChange={handleChange} index={index} />
      </Grid.Column>
    </Grid.Row>
    <Grid.Row>
      <Grid.Column>
        <Form.Input type='date' label='Expiration Date' name='expire'
          onChange={handleChange} value={fields.expire} index={index} />
      </Grid.Column>
      <Grid.Column>
        <Form.Input type="date" label='VIS Date' name='visDate' 
          onChange={handleChange} value={fields.visDate} index={index} />
      </Grid.Column>
      <Grid.Column>
        <Form.Group>
          <Form.Input label={fields.maxQuantity ? `Quantity (${fields.maxQuantity} remaining)` : 'Quantity'} 
            type='number' min={1} name='quantity' className='quantity'
            onChange={handleChange} value={fields.quantity} placeholder='1' disabled={patientUse} index={index} />
          <Form.Input label='Dose #' type='number' min={1} name='dose' className='unit'
            onChange={handleChange} placeholder='1' disabled={nonPatientUse} index={index} />
        </Form.Group>
      </Grid.Column>
    </Grid.Row>
  </>
  // );
);

DispenseVaccineSingle.propTypes = {
  names: PropTypes.array.isRequired,
  lotIds: PropTypes.array.isRequired,
  brands: PropTypes.array.isRequired,
  fields: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  onLotIdSelect: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};

export default DispenseVaccineSingle;
