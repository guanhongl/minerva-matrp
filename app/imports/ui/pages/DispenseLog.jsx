import React, { useEffect, useState } from 'react';
import {
  Header, Container, Table, Segment, Divider, Dropdown, Pagination, Grid, Loader, Icon, Input, Popup,
} from 'semantic-ui-react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Historicals, dispenseTypes, inventoryTypes } from '../../api/historical/HistoricalCollection';
import { Sites } from '../../api/site/SiteCollection';
import DispenseLogRow from '../components/dispense-log/DispenseLogRow';
import { PAGE_IDS } from '../utilities/PageIDs';
import { COMPONENT_IDS } from '../utilities/ComponentIDs';
import { fetchField, getOptions } from '../utilities/Functions';
import { cloneDeep } from 'lodash';

// Used for the amount of history log rows that appear in each page.
const logPerPage = [
  { key: 1, value: 10, text: '10' },
  { key: 2, value: 25, text: '25' },
  { key: 3, value: 50, text: '50' },
  { key: 4, value: 100, text: '100' },
];

const getFilters = (arr) => [{ key: 'All', value: 0, text: 'All' }, ...getOptions(arr)];

/** Renders the Dispense Log Page. */
const DispenseLog = ({ ready, historicals, sites }) => {
  if (ready) {
    const [filterHistoricals, setFilterHistoricals] = useState([]);
    useEffect(() => {
      setFilterHistoricals(historicals);
    }, [historicals]);

    const [searchQuery, setSearchQuery] = useState('');
    const [pageNo, setPageNo] = useState(1);
    const [minDateFilter, setMinDateFilter] = useState(0);
    const [maxDateFilter, setMaxDateFilter] = useState(0);
    const [inventoryFilter, setInventoryFilter] = useState(0);
    const [dispenseTypeFilter, setDispenseTypeFilter] = useState(0);
    const [siteFilter, setSiteFilter] = useState(0);
    const [maxLog, setMaxLog] = useState(10);

    // handles filtering
    useEffect(() => {
      let filter = cloneDeep(historicals); // deep clone
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filter = filter.filter(({ dispensedTo, element }) => (
          element.findIndex(({ name }) => name.toLowerCase().includes(query)) !== -1 ||
          dispensedTo.toLowerCase().includes(query)
        ));
      }
      if (inventoryFilter) {
        filter = filter.filter(({ inventoryType }) => inventoryType === inventoryFilter);
      }
      if (dispenseTypeFilter) {
        filter = filter.filter(({ dispenseType }) => dispenseType === dispenseTypeFilter);
      }
      if (siteFilter) {
        filter = filter.filter(({ site }) => site === siteFilter);
      }
      if (minDateFilter) {
        const minDate = moment(minDateFilter).utc().format();
        filter = filter.filter(({ dateDispensed }) => dateDispensed >= minDate);
      }
      if (maxDateFilter) {
        const maxDate = moment(maxDateFilter).utc().format();
        filter = filter.filter(({ dateDispensed }) => dateDispensed <= maxDate);
      }
      setFilterHistoricals(filter);
    }, [searchQuery, inventoryFilter, dispenseTypeFilter, siteFilter, minDateFilter, maxDateFilter]);

    const handleSearch = (event, { value }) => setSearchQuery(value);
    const handleInventoryFilter = (event, { value }) => setInventoryFilter(value);
    const handleMinDateFilter = (event, { value }) => setMinDateFilter(value);
    const handleMaxDateFilter = (event, { value }) => setMaxDateFilter(value);
    const handleDispenseTypeFilter = (event, { value }) => setDispenseTypeFilter(value);
    const handleSiteFilter = (event, { value }) => setSiteFilter(value);
    const handleMaxLog = (event, { value }) => setMaxLog(value);

    return (
      <div className='status-wrapped'>
        <Container id={PAGE_IDS.DISPENSE_LOG}>
          <Segment className='status-wrapped'>
            <Header as="h2">
              <Header.Content>
                History Dispense Log
                <Header.Subheader>
                  <i>Use the search filter to look for a specific Patient Number
                    or use the dropdown filters.</i>
                </Header.Subheader>
              </Header.Content>
            </Header>
            <Grid columns="equal" stackable>
              <Grid.Row>
                <Grid.Column>
                  <Popup inverted
                    trigger={<Input placeholder='Filter by patient...' icon='search' onChange={handleSearch}
                      id={COMPONENT_IDS.DISPENSE_FILTER}/>}
                    content='This allows you to filter the Dispense Log table by Patient Number or Inventory Name.'/>
                </Grid.Column>
                <Grid.Column>
                  <Popup inverted
                    trigger={
                      <Input type="date" label={{ basic: true, content: 'From' }} labelPosition='left'
                        onChange={handleMinDateFilter} max={maxDateFilter} />
                    }
                    content="This allows you to filter the Dispense Log table
                  from the selected 'From' date to today's date or the selected 'To' date."/>
                </Grid.Column>
                <Grid.Column>
                  <Input type="date" label={{ basic: true, content: 'To' }} labelPosition='left'
                    onChange={handleMaxDateFilter} min={minDateFilter} />
                </Grid.Column>
              </Grid.Row>
            </Grid>
            <Divider/>
            <Grid divided columns="equal" stackable>
              <Grid.Row textAlign='center'>
                <Grid.Column>
                  Inventory Type: {' '}
                  <Dropdown
                    inline
                    options={getFilters(inventoryTypes)}
                    search
                    value={inventoryFilter}
                    onChange={handleInventoryFilter}
                    id={COMPONENT_IDS.INVENTORY_TYPE}
                  />
                </Grid.Column>
                <Grid.Column>
                  Dispense Type: {' '}
                  <Dropdown inline={true} options={getFilters(dispenseTypes)} search value={dispenseTypeFilter}
                    onChange={handleDispenseTypeFilter} id={COMPONENT_IDS.DISPENSE_TYPE}/>
                </Grid.Column>
                <Grid.Column>
                Dispense Site: {' '}
                  <Dropdown inline={true} options={getFilters(sites)} search value={siteFilter}
                    onChange={handleSiteFilter} id={COMPONENT_IDS.DISPENSE_SITE}/>
                </Grid.Column>
              </Grid.Row>
            </Grid>
            <Divider/>
            Records per page:{' '}
            <Dropdown inline={true} options={logPerPage} value={maxLog} onChange={handleMaxLog}/>
            Total count: {filterHistoricals.length}
            <Table striped singleLine columns={7} color='blue' compact collapsing unstackable>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Date & Time</Table.HeaderCell>
                  <Table.HeaderCell>Inventory Type</Table.HeaderCell>
                  <Table.HeaderCell>Dispense Type</Table.HeaderCell>
                  <Table.HeaderCell>Patient Number</Table.HeaderCell>
                  <Table.HeaderCell>Site</Table.HeaderCell>
                  <Table.HeaderCell>Dispensed By</Table.HeaderCell>
                  <Table.HeaderCell>Information</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {
                  filterHistoricals.length ?
                    filterHistoricals.slice((pageNo - 1) * maxLog, pageNo * maxLog)
                      .map(history => <DispenseLogRow key={history._id} history={history}/>)
                    :
                    <Table.Row>
                      <Table.Cell as='td' colSpan='7' textAlign='center' content={'No records to display.'} />
                    </Table.Row>
                }
              </Table.Body>
              <Table.Footer>
                <Table.Row>
                  <Table.HeaderCell colSpan="11">
                    <Pagination
                      totalPages={Math.ceil(filterHistoricals.length / maxLog)}
                      activePage={pageNo}
                      onPageChange={(event, data) => setPageNo(data.activePage)}
                      ellipsisItem={{ content: <Icon name='ellipsis horizontal'/>, icon: true }}
                      firstItem={{ content: <Icon name='angle double left'/>, icon: true }}
                      lastItem={{ content: <Icon name='angle double right'/>, icon: true }}
                      prevItem={{ content: <Icon name='angle left'/>, icon: true }}
                      nextItem={{ content: <Icon name='angle right'/>, icon: true }}
                    />
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Footer>
            </Table>
          </Segment>
        </Container>
      </div>
    );
  }
  return (<Loader active>Getting data</Loader>);
};

DispenseLog.propTypes = {
  historicals: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
  sites: PropTypes.array.isRequired,
};

// withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker
export default withTracker(() => {
  const historicalSub = Historicals.subscribeHistorical();
  const siteSub = Sites.subscribe();
  // Determine if the subscription is ready
  const ready = historicalSub.ready() && siteSub.ready();
  // Get the Historical documents.
  const historicals = Historicals.find({}, { sort: { dateDispensed: -1 } }).fetch();
  const sites = fetchField(Sites, "site");
  return {
    historicals,
    ready,
    sites,
  };
})(DispenseLog);
