import React, { useState } from 'react';
import { Icon, Table } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
import moment from 'moment';
import DrugInfoPage from './DrugInfoPage';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { Drugs } from '../../../api/drug/DrugCollection';
import { removeItMethod, updateMethod } from '../../../api/base/BaseCollection.methods';

const DrugStatusRow = ({ med, drugTypes, locations, units, brands }) => {
  const [expand, setExpand] = useState(false);
  
  const handleOpen = () => setExpand(!expand);

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
          const collectionName = Drugs.getCollectionName();
          removeItMethod.callPromise({ collectionName, instance: med._id })
            .then(() => swal('Success', `${med.drug} deleted successfully`, 'success', { buttons: false, timer: 3000 }))
            .catch(error => swal('Error', error.message, 'error'));
        }
      });
  };

  const deleteLot = (uuid, lotId) => {
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
          const collectionName = Drugs.getCollectionName();
          const exists = Drugs.findOne({ _id: med._id });
          const { lotIds } = exists;
          const targetIndex = lotIds.findIndex((obj => obj._id === uuid));
          lotIds.splice(targetIndex, 1);
          const updateData = { id: med._id, lotIds };
          updateMethod.callPromise({ collectionName, updateData })
            .then(() => swal('Success', `${med.drug} updated successfully`, 'success', { buttons: false, timer: 3000 }))
            .catch(error => swal('Error', error.message, 'error'));
        }
      });
  };

  return (
    <>
      {/* the drug row */}
      <Table.Row negative={isExpired.includes(true)} id={COMPONENT_IDS.MED_STATUS_ROW}>
        <Table.Cell className='caret' onClick={handleOpen}>
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
                <Table.HeaderCell/>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {
                med.lotIds.map(({ _id: uuid, lotId, brand, expire, location, quantity, donated }, index) => (
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
                    <Table.Cell className='icons'>
                      {/* <Button size='mini' circular icon='info' color='linkedin' id={COMPONENT_IDS.DRUG_PAGE_BUTTON}
                        onClick={() => setOpen(true)} /> */}
                      <DrugInfoPage info={med} detail={med.lotIds[index]} drugTypes={drugTypes} locations={locations} units={units} brands={brands} />
                      <Icon name='trash alternate' onClick={() => deleteLot(uuid, lotId)} />
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

DrugStatusRow.propTypes = {
  med: PropTypes.shape({
    drug: PropTypes.string,
    drugType: PropTypes.array,
    unit: PropTypes.string,
    lotIds: PropTypes.array,
    minQuantity: PropTypes.number,
    _id: PropTypes.string,
  }).isRequired,
};

export default DrugStatusRow;
