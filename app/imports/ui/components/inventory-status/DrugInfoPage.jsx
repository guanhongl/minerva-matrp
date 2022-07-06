import React, { useState } from 'react';
import { Button, Modal, Input, Checkbox, TextArea, Select, Icon } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import swal from 'sweetalert';
import moment from 'moment';
import { updateMethod } from '../../../api/drug/DrugCollection.methods';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { printQRCode, getOptions } from '../../utilities/Functions';

// TODO fix bug where submit re-renders
const submit = (_id, uuid, fields) => {
  updateMethod.callPromise({ _id, uuid, fields })
    .then(success => swal('Success', success, 'success', { buttons: false, timer: 3000 }))
    .catch(error => swal('Error', error.message, 'error'));
};

const DrugInfoPage = ({ info: { _id, drug, drugType, minQuantity, unit }, 
                       detail: { _id: uuid, lotId, brand, expire, location, quantity, donated, donatedBy, note, QRCode },
                       drugTypes, locations, units, brands }) => {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);

  // form fields
  const initialState = {
    newDrugType: drugType,
    newMinQuantity: minQuantity,
    newUnit: unit,
    newLotId: lotId,
    newBrand: brand,
    newExpire: expire,
    newLocation: location,
    newQuantity: quantity,
    newDonated: donated,
    newDonatedBy: donatedBy,
    newNote: note,
  };

  const [fields, setFields] = useState(initialState);

  const handleEdit = () => {
    setEdit(!edit);
    setFields(initialState);
  }

  const handleChange = (event, { name, value, checked }) => {
    setFields({ ...fields, [name]: value ?? checked });
  };

  return (
    <Modal
      closeIcon
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      size='small'
      id={COMPONENT_IDS.DRUG_PAGE}
      className='info-modal'
      trigger={<Icon name='info' id={COMPONENT_IDS.DRUG_PAGE_BUTTON} />}
    >
      <Modal.Header>Drug Information</Modal.Header>
      <Modal.Content scrolling>
        <table>
          <tbody>
            <tr>
              <td>General Info</td>
              <td>
                <div>
                  <span className='header'>Drug:</span>
                  {
                    edit ?
                      <Input value={drug} disabled />
                      :
                      <span>{drug}</span>
                  }
                </div>
                <div>
                  <span className='header'>Drug Type(s):</span>
                  {
                    edit ?
                      <Select fluid name='newDrugType' value={fields.newDrugType} options={getOptions(drugTypes)} multiple onChange={handleChange} />
                      :
                      <span>{drugType.join(', ')}</span>
                  }
                </div>
                <div>
                  <span className='header'>Minimum Quantity:</span>
                  {
                    edit ?
                      <Input name='newMinQuantity' value={fields.newMinQuantity} type='number' min={1} onChange={handleChange} />
                      :
                      <span>{minQuantity}</span>
                  }
                </div>
                <div>
                  <span className='header'>Unit:</span>
                  {
                    edit ?
                      <Select fluid name='newUnit' value={fields.newUnit} options={getOptions(units)} onChange={handleChange} />
                      :
                      <span>{unit}</span>
                  }
                </div>
              </td>
            </tr>
            <tr>
              <td>Details</td>
              <td>
                <div>
                  <span className='header'>Lot Number:</span>
                  {
                    edit ?
                      <Input name='newLotId' value={fields.newLotId} onChange={handleChange} />
                      :
                      <span>{lotId}</span>
                  }
                </div>
                <div>
                  <span className='header'>Brand:</span>
                  {
                    edit ?
                      <Select fluid name='newBrand' value={fields.newBrand} options={getOptions(brands)} onChange={handleChange} />
                      :
                      <span>{brand}</span>
                  }
                </div>
                <div>
                  <span className='header'>Expiration Date:</span>
                  {
                    edit ?
                      <Input name='newExpire' value={fields.newExpire} type='date' onChange={handleChange} />
                      :
                      <span>{expire ? moment(expire).format('LL') : 'N/A'}</span>
                  }
                </div>
                <div>
                  <span className='header'>Location:</span>
                  {
                    edit ?
                      <Select fluid name='newLocation' value={fields.newLocation} options={getOptions(locations)} onChange={handleChange} />
                      :
                      <span>{location}</span>
                  }
                </div>
                <div>
                  <span className='header'>Quantity:</span>
                  {
                    edit ?
                      <Input name='newQuantity' value={fields.newQuantity} type='number' min={1} onChange={handleChange} />
                      :
                      <span>{quantity}</span>
                  }
                </div>
                <div>
                  <span className='header'>Donated:</span>
                  {
                    edit ?
                      <Checkbox name='newDonated' checked={fields.newDonated} onChange={handleChange} />
                      :
                      <span>{donated ? 'Yes' : 'No'}</span>
                  }
                </div>
                {
                  fields.newDonated &&
                  <div>
                    <span className='header'>Donated By:</span>
                    {
                      edit ?
                        <Input name='newDonatedBy' value={fields.newDonatedBy} onChange={handleChange} />
                        :
                        <span>{donatedBy}</span>
                    }
                  </div>
                }
              </td>
            </tr>
            <tr>
              <td>Note</td>
              <td>
                <TextArea rows={3} name='newNote' value={fields.newNote} onChange={handleChange} />
              </td>
            </tr>
          </tbody>
        </table>
      </Modal.Content>
      <Modal.Actions>
        {
          QRCode &&
          <Button
            circular
            // content="Print QR Code"
            // labelPosition='right'
            icon='qrcode'
            onClick={() => printQRCode(QRCode)}
            color='black'
          />
        }
        <Button
          circular
          icon={edit ? 'ban' : 'pencil'}
          color='linkedin'
          onClick={handleEdit}
        />
        <Button
          // id={COMPONENT_IDS.DRUG_EDIT}
          circular
          // content="Save Changes"
          // labelPosition='right'
          icon='check'
          onClick={() => submit(_id, uuid, fields)}
          color='green'
        />
        {/* <Button color='black' onClick={() => setOpen(false)} id={COMPONENT_IDS.DRUG_CLOSE}>
          Close
        </Button> */}
      </Modal.Actions>
    </Modal>
  );
};

// Require info and detail to be passed to this component.
DrugInfoPage.propTypes = {
  info: PropTypes.object.isRequired,
  detail: PropTypes.object.isRequired,
};

export default DrugInfoPage;