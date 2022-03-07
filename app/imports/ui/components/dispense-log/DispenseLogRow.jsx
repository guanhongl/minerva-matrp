import React, { useState } from 'react';
import { Icon, Popup, Table, Button } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import moment from 'moment';
import DrugRecord from './DrugRecord';
import SupplyRecord from './SupplyRecord';
import VaccineRecord from './VaccineRecord';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';

const DispenseLogRow = ({ history }) => {
  const [open, setOpen] = useState(false);
  const historyDate = moment(history.dateDispensed).format('MM/DD/YYYY, hh:mm A');

  return (
    <>
      <Table.Row>
        <Table.Cell>
          <i>{historyDate}</i>
        </Table.Cell>
        <Table.Cell>{history.inventoryType}</Table.Cell>
        <Table.Cell>{history.dispenseType}</Table.Cell>
        <Table.Cell>{history.dispensedTo}</Table.Cell>
        <Table.Cell>{history.site}</Table.Cell>
        <Table.Cell textAlign='center'>
          <Popup trigger={<Icon name='user circle' size='large' color='grey'/>}
            content={history.dispensedFrom} size='small' position='right center' inverted/>
        </Table.Cell>
        <Table.Cell textAlign='center'>
          <Button size='mini' circular icon='info' color='linkedin' id={COMPONENT_IDS.DISPENSE_INFO_BUTTON}
            onClick={() => setOpen(true)} />
        </Table.Cell>
      </Table.Row>
      {
        history.inventoryType === 'Medication' &&
        <DrugRecord open={open} setOpen={setOpen} record={history} />
      }
      {
        history.inventoryType === 'Supply' &&
        <SupplyRecord open={open} setOpen={setOpen} record={history} />
      }
      {
        history.inventoryType === 'Vaccine' &&
        <VaccineRecord open={open} setOpen={setOpen} record={history} />
      }
    </>
  );
};

DispenseLogRow.propTypes = {
  history: PropTypes.shape({
    inventoryType: PropTypes.string,
    dateDispensed: PropTypes.date,
    dispensedTo: PropTypes.string,
    dispenseType: PropTypes.string,
    brand: PropTypes.string,
    dispensedFrom: PropTypes.string,
  }).isRequired,
};

export default DispenseLogRow;
