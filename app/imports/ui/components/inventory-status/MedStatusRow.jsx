import React, { useState } from 'react';
import { Icon, Table } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
import moment from 'moment';
import MedInfoPage from './MedInfoPage';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { Medications } from '../../../api/medication/MedicationCollection';
import { removeItMethod } from '../../../api/base/BaseCollection.methods';

const MedStatusRow = ({ med, drugTypes, locations, units }) => {
  const [expand, setExpand] = useState(false);
  
  const handleOpen = () => setExpand(!expand);

  // const currentDate = new Date();
  // const expirations = med.lotIds.map(({ expire }) => (expire && expire.split('-')));
  // const expiredDates = expirations.map((expiration) => {
  //   const expiredDate = new Date();
  //   return expiration ?
  //     expiredDate.setFullYear(parseInt(expiration[0], 10), parseInt(expiration[1], 10) - 1, parseInt(expiration[2], 10))
  //     : expiredDate;
  // });
  // const isExpired = expiredDates.map((expiredDate) => expiredDate < currentDate);

  const currentDate = moment();
  const isExpired = med.lotIds.map(({ expire }) => {
    if (expire) {
      return currentDate > moment(expire);
    }
    return false;
  });

  const totalQuantity = med.lotIds.length ?
    _.pluck(med.lotIds, 'quantity')
      .reduce((prev, current, index) => (isExpired[index] ? prev : prev + current), 0)
    : 0;
  const status = Math.floor((totalQuantity / med.minQuantity) * 100);
  const getColor = () => {
    let color;
    if (totalQuantity >= med.minQuantity) { // range [min, inf)
      color = 'green';
    } else if (totalQuantity > 0 && totalQuantity < med.minQuantity) { // range (0, min]
      color = 'yellow';
    } else { // range (0)
      color = 'red';
    }
    return color;
  };

  const deleteDrug = () => {
    swal({
      title: 'Are you sure?',
      text: `Do you really want to delete ${med.drug}?`,
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
          removeItMethod.callPromise({ collectionName, instance: med._id })
            .then(() => swal('Success', `${med.drug} deleted successfully`, 'success', { buttons: false, timer: 3000 }))
            .catch(error => swal('Error', error.message, 'error'));
        }
      });
  };

  return (
    <>
      {/* the drug row */}
      <Table.Row onClick={handleOpen} negative={isExpired.includes(true)} id={COMPONENT_IDS.MED_STATUS_ROW}>
        <Table.Cell>
          <Icon name={`caret ${expand ? 'down' : 'up'}`} />
        </Table.Cell>
        <Table.Cell>{med.drug}</Table.Cell>
        <Table.Cell>{med.drugType.join(', ')}</Table.Cell>
        <Table.Cell>{totalQuantity}</Table.Cell>
        <Table.Cell>{med.unit}</Table.Cell>
        <Table.Cell>
          <>
            <Icon color={getColor()} name='circle' />
            <span>{status}%</span>
          </>
        </Table.Cell>
        <Table.Cell>
          <Icon name='trash alternate' onClick={deleteDrug} />
        </Table.Cell>
      </Table.Row>

      {/* the lotId row */}
      <Table.Row style={{ display: expand ? 'table-row' : 'none' }}>
        <Table.Cell colSpan={7} className='lot-row'>
          <Table color='blue' unstackable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Lot Number</Table.HeaderCell>
                <Table.HeaderCell>Brand</Table.HeaderCell>
                <Table.HeaderCell>Expiration</Table.HeaderCell>
                <Table.HeaderCell>Location</Table.HeaderCell>
                <Table.HeaderCell>Quantity</Table.HeaderCell>
                <Table.HeaderCell>Donated</Table.HeaderCell>
                <Table.HeaderCell>Information</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {
                med.lotIds.map(({ lotId, brand, expire, location, quantity, donated }, index) => (
                  <Table.Row key={lotId} negative={isExpired[index]}>
                    <Table.Cell>{lotId}</Table.Cell>
                    <Table.Cell>{brand}</Table.Cell>
                    <Table.Cell>{expire}</Table.Cell>
                    <Table.Cell>{location}</Table.Cell>
                    <Table.Cell>{quantity}</Table.Cell>
                    <Table.Cell>
                      {
                        donated &&
                        <Icon name='check' color='green'/>
                      }
                    </Table.Cell>
                    <Table.Cell>
                      {/* <Button size='mini' circular icon='info' color='linkedin' id={COMPONENT_IDS.DRUG_PAGE_BUTTON}
                        onClick={() => setOpen(true)} /> */}
                      <MedInfoPage info={med} detail={med.lotIds[index]} drugTypes={drugTypes} locations={locations} units={units} />
                    </Table.Cell>
                  </Table.Row>
                ))
              }
            </Table.Body>
          </Table>
        </Table.Cell>
      </Table.Row>
    </>
  );
};

MedStatusRow.propTypes = {
  med: PropTypes.shape({
    drug: PropTypes.string,
    drugType: PropTypes.array,
    unit: PropTypes.string,
    lotIds: PropTypes.array,
    minQuantity: PropTypes.number,
    _id: PropTypes.string,
  }).isRequired,
};

export default MedStatusRow;
