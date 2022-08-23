import React, { useEffect } from 'react';
import { Grid, Form } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { getOptions } from '../../utilities/Functions';

const DispenseVaccineSingle = ({ names, lotIds, brands, fields, 
  handleChange, setDonatedBy, setLotId, index, patientUse, nonPatientUse }) => {
  // handle donated check
  useEffect(() => {
    if (!fields.donated) {
      setDonatedBy(index)
    }
  }, [fields.donated])

  // handle lotId select
  useEffect(() => {
    setLotId(index)
  }, [fields.lotId])

  return (
    <>
      <Grid.Row className="dispense-single">
        <Grid.Column>
          <Form.Select clearable search label='Lot Number' options={getOptions(lotIds)}
            placeholder="Z9Z99" name='lotId' value={fields.lotId} onChange={handleChange} index={index} />
        </Grid.Column>
        <Grid.Column>
          <Form.Select clearable search label='Vaccine' options={getOptions(names)}
            placeholder="COVID-19" name='vaccine' value={fields.vaccine} onChange={handleChange} index={index} />
        </Grid.Column>
        <Grid.Column>
          <Form.Select clearable search label='Manufacturer' options={getOptions(brands)}
            placeholder="Moderna" name='brand' value={fields.brand} onChange={handleChange} index={index} />
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <Grid.Column>
          <Form.Group className="date-group">
            <Form.Input type='date' label='Exp. Date' name='expire'
              onChange={handleChange} value={fields.expire} index={index} />
            <Form.Input type="date" label='VIS Date' name='visDate' 
              onChange={handleChange} value={fields.visDate} index={index} />
          </Form.Group>
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
        <Grid.Column>
          <Form.Field>
            <label>Donated</label>
            <Form.Group>
              <Form.Checkbox name='donated' className='donated-field'
                onChange={handleChange} checked={fields.donated} index={index}/>
              <Form.Input name='donatedBy' className='donated-by-field' placeholder='Donated By'
                onChange={handleChange} value={fields.donatedBy} disabled={!fields.donated} index={index}/>
            </Form.Group>
          </Form.Field>
        </Grid.Column>
      </Grid.Row>
    </>
  );
};

DispenseVaccineSingle.propTypes = {
  names: PropTypes.array.isRequired,
  lotIds: PropTypes.array.isRequired,
  brands: PropTypes.array.isRequired,
  fields: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  setDonatedBy: PropTypes.func.isRequired,
  setLotId: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};

export default DispenseVaccineSingle;
