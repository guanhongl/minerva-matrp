import React, { useEffect } from 'react';
import { Grid, Form } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { getOptions } from '../../utilities/Functions';

const DispenseDrugSingle = ({ names, units, brands, lotIds, fields, handleChange, setDonatedBy, setLotId, index }) => {
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
          <Form.Select clearable search label='Lot Number' options={getOptions(lotIds)} placeholder="Z9Z99"
            name='lotId' onChange={handleChange} value={fields.lotId} id={COMPONENT_IDS.DISPENSE_MED_LOT} index={index}/>
        </Grid.Column>
        <Grid.Column>
          <Form.Select clearable search label='Drug Name' options={getOptions(names)} placeholder="Acetaminophen 160mg"
            name='drug' onChange={handleChange} value={fields.drug} index={index}/>
        </Grid.Column>
        <Grid.Column>
          <Form.Select clearable search label='Brand' options={getOptions(brands)} placeholder="Tylenol"
            name='brand' onChange={handleChange} value={fields.brand} index={index}/>
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <Grid.Column>
          {/* expiration date may be null */}
          <Form.Input type='date' label='Expiration Date' name='expire'
            onChange={handleChange} value={fields.expire} index={index}/>
        </Grid.Column>
        <Grid.Column>
          <Form.Group>
            <Form.Input label={fields.maxQuantity ? `Quantity (${fields.maxQuantity} remaining)` : 'Quantity'}
              type='number' min={1} name='quantity' className='quantity' placeholder='30'
              onChange={handleChange} value={fields.quantity} index={index} id={COMPONENT_IDS.DISPENSE_MED_QUANTITY}/>
            <Form.Select compact name='unit' onChange={handleChange} value={fields.unit} className='unit'
              options={getOptions(units)} index={index} />
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

DispenseDrugSingle.propTypes = {
  names: PropTypes.array.isRequired,
  units: PropTypes.array.isRequired,
  brands: PropTypes.array.isRequired,
  lotIds: PropTypes.array.isRequired,
  fields: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  setDonatedBy: PropTypes.func.isRequired,
  setLotId: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};

export default DispenseDrugSingle;
