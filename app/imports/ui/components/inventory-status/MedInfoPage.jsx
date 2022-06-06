import React, { useState } from 'react';
import { Button, Modal, Input, Checkbox, TextArea, Select } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import swal from 'sweetalert';
import moment from 'moment';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { Medications } from '../../../api/medication/MedicationCollection';
import { updateMethod } from '../../../api/base/BaseCollection.methods';
import { printQRCode, getOptions } from '../../utilities/Functions';

const MedInfoPage = ({ info: { _id, drug, drugType, minQuantity, unit }, 
                       detail: { _id: uuid, lotId, brand, expire, location, quantity, donated, donatedBy, note, QRCode },
                       drugTypes, locations, units }) => {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);

  // form fields
  const initialState = {
    newDrug: drug,
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

  // TODO fix bug where submit re-renders
  const submit = () => {
    fields.newMinQuantity = parseInt(fields.newMinQuantity, 10);
    fields.newQuantity = parseInt(fields.newQuantity, 10);

    const collectionName = Medications.getCollectionName();
    const exists = Medications.findOne({ _id });
    const { lotIds } = exists;
    const target = lotIds.find(obj => obj._id === uuid);
    target.lotId = fields.newLotId;
    target.brand = fields.newBrand;
    target.expire = fields.newExpire;
    target.location = fields.newLocation;
    target.quantity = fields.newQuantity;
    target.donated = fields.newDonated;
    target.donatedBy = fields.newDonated ? fields.newDonatedBy : '';
    target.note = fields.newNote;
    const updateData = { id: _id, drug: fields.newDrug, drugType: fields.newDrugType, minQuantity: fields.newMinQuantity, unit: fields.newUnit, lotIds };
    updateMethod.callPromise({ collectionName, updateData })
      .then(() => swal('Success', 'Note updated successfully', 'success', { buttons: false, timer: 3000 }))
      .catch(error => swal('Error', error.message, 'error'));
  };

  const deleteOption = () => {
    swal({
      title: 'Are you sure?',
      text: `Do you really want to delete ${lotId}?`,
      icon: 'warning',
      buttons: [
        'No, cancel it!',
        'Yes, I am sure!',
      ],
      dangerMode: true,
    })
      .then((isConfirm) => {
        // if 'yes'
        if (isConfirm) {
          const collectionName = Medications.getCollectionName();
          const exists = Medications.findOne({ drug });
          const { lotIds } = exists;
          const targetIndex = lotIds.findIndex((obj => obj.lotId === lotId));
          lotIds.splice(targetIndex, 1);
          const updateData = { id: _id, lotIds };
          updateMethod.callPromise({ collectionName, updateData })
            .then(() => swal('Success', `${drug} updated successfully`, 'success', { buttons: false, timer: 3000 }))
            .catch(error => swal('Error', error.message, 'error'));
        }
      });
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
      trigger={<Button size='mini' circular icon='info' color='linkedin' id={COMPONENT_IDS.DRUG_PAGE_BUTTON} />}
    >
      <Modal.Header>Drug Information</Modal.Header>
      <Modal.Content scrolling>
        <table>
          <tbody>
            <tr>
              <td style={{ width: '150px' }}>General Info</td>
              <td>
                <div>
                  <span className='header'>Drug:</span>
                  {
                    edit ?
                      <Input name='newDrug' value={fields.newDrug} onChange={handleChange} />
                      :
                      <>{drug}</>
                  }
                </div>
                <div>
                  <span className='header'>Drug Type(s):</span>
                  {
                    edit ?
                      <Select name='newDrugType' value={fields.newDrugType} options={getOptions(drugTypes)} multiple onChange={handleChange} />
                      :
                      <>{drugType.join(', ')}</>
                  }
                </div>
                <div>
                  <span className='header'>Minimum Quantity:</span>
                  {
                    edit ?
                      <Input name='newMinQuantity' value={fields.newMinQuantity} type='number' min={1} onChange={handleChange} />
                      :
                      <>{minQuantity}</>
                  }
                </div>
                <div>
                  <span className='header'>Unit:</span>
                  {
                    edit ?
                      <Select name='newUnit' value={fields.newUnit} options={getOptions(units)} onChange={handleChange} />
                      :
                      <>{unit}</>
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
                      <>{lotId}</>
                  }
                </div>
                <div>
                  <span className='header'>Brand:</span>
                  {
                    edit ?
                      <Input name='newBrand' value={fields.newBrand} onChange={handleChange} />
                      :
                      <>{brand}</>
                  }
                </div>
                <div>
                  <span className='header'>Expiration Date:</span>
                  {
                    edit ?
                      <Input name='newExpire' value={fields.newExpire} type='date' onChange={handleChange} />
                      :
                      <>{expire ? moment(expire).format('LL') : 'N/A'}</>
                  }
                </div>
                <div>
                  <span className='header'>Location:</span>
                  {
                    edit ?
                      <Select name='newLocation' value={fields.newLocation} options={getOptions(locations)} onChange={handleChange} />
                      :
                      <>{location}</>
                  }
                </div>
                <div>
                  <span className='header'>Quantity:</span>
                  {
                    edit ?
                      <Input name='newQuantity' value={fields.newQuantity} type='number' min={1} onChange={handleChange} />
                      :
                      <>{quantity}</>
                  }
                </div>
                <div>
                  <span className='header'>Donated:</span>
                  {
                    edit ?
                      <Checkbox name='newDonated' checked={fields.newDonated} onChange={handleChange} />
                      :
                      <>{donated ? 'Yes' : 'No'}</>
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
                        <>{donatedBy}</>
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
          onClick={() => submit()}
          color='green'
        />
        <Button
          circular
          // content="Delete"
          // labelPosition='right'
          icon='trash alternate'
          color='red'
          onClick={() => deleteOption()}
        />
        {/* <Button color='black' onClick={() => setOpen(false)} id={COMPONENT_IDS.DRUG_CLOSE}>
          Close
        </Button> */}
      </Modal.Actions>
    </Modal>
  );
};

// Require info and detail to be passed to this component.
MedInfoPage.propTypes = {
  info: PropTypes.object.isRequired,
  detail: PropTypes.object.isRequired,
};

export default MedInfoPage;