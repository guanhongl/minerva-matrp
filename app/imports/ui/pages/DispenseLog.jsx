import React, { useEffect, useState } from 'react';
import { Header, Container, Table, Segment, Divider, Dropdown, Pagination, Loader, Icon, Input, Popup } from 'semantic-ui-react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
import moment from 'moment';
import { ZipZap } from 'meteor/udondan:zipzap';
import { Historicals, dispenseTypes, inventoryTypes } from '../../api/historical/HistoricalCollection';
import { Sites } from '../../api/site/SiteCollection';
import DispenseLogRow from '../components/dispense-log/DispenseLogRow';
import { PAGE_IDS } from '../utilities/PageIDs';
import { COMPONENT_IDS } from '../utilities/ComponentIDs';
import { fetchField, getOptions } from '../utilities/Functions';
import { cloneDeep } from 'lodash';
import { downloadDatabaseMethod } from '../../api/ManageDatabase.methods';

// Used for the amount of history log rows that appear in each page.
const logPerPage = [
  { key: 1, value: 10, text: '10' },
  { key: 2, value: 25, text: '25' },
  { key: 3, value: 50, text: '50' },
  { key: 4, value: 100, text: '100' },
];

const getFilters = (arr) => [{ key: 'All', value: 0, text: 'All' }, ...getOptions(arr)];

// replace " " with "-" and make lowercase
const formatQuery = (query) => {
  return query.replace(/\s+/g, "-").toLowerCase();
};

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
    const [loading, setLoading] = useState(false);

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
        // const minDate = moment(minDateFilter).utc().format();
        const minDate = moment(minDateFilter);
        filter = filter.filter(({ dateDispensed }) => moment(dateDispensed) >= minDate);
      }
      if (maxDateFilter) {
        // const maxDate = moment(maxDateFilter).utc().format();
        const maxDate = moment(maxDateFilter);
        filter = filter.filter(({ dateDispensed }) => moment(dateDispensed) <= maxDate);
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

    // download DB w/ filter
    const download = () => {
      setLoading(true);
      const _ids = _.pluck(filterHistoricals, "_id");
      downloadDatabaseMethod.callPromise({ db: "history", _ids })
        .then(csv => {
          const zip = new ZipZap();
          const dir = 'minerva-db';
          // query, inventory-type, dispense-type, site, min-date, max-date
          let filter = "";
          if (searchQuery) {
            filter += `query=${formatQuery(searchQuery)}&`;
          }
          if (inventoryFilter) {
            filter += `inventory-type=${formatQuery(inventoryFilter)}&`;
          }
          if (dispenseTypeFilter) {
            filter += `dispense-type=${formatQuery(dispenseTypeFilter)}&`;
          }
          if (siteFilter) {
            filter += `site=${formatQuery(siteFilter)}&`;
          }
          if (minDateFilter) {
            filter += `min-date=${moment(minDateFilter).format("YYYY-MM-DD")}&`;
          }
          if (maxDateFilter) {
            filter += `max-date=${moment(maxDateFilter).format("YYYY-MM-DD")}&`;
          }
          // append "-" and remove the last char
          if (filter) {
            filter = `-${filter.slice(0, -1)}`;
          }
          const fileName = `${dir}/${moment().format("YYYY-MM-DD")}-history${filter}.csv`;
          zip.file(fileName, csv);
          zip.saveAs(`${dir}.zip`);
        })
        .catch(error => swal("Error", error.message, "error"))
        .finally(() => setLoading(false));
    };

    return (
      <Container id={PAGE_IDS.DISPENSE_LOG}>
        <Segment>
          <Header as="h2">
            <Header.Content>
              Dispense Log
              <Header.Subheader>
                Use the search and dropdown filters to find a specific patient.
              </Header.Subheader>
            </Header.Content>
          </Header>

          <div className='controls'>
            <Popup
              trigger={<Input placeholder='Filter by patient...' icon='search'
                onChange={handleSearch} value={searchQuery} id={COMPONENT_IDS.DISPENSE_FILTER}/>}
              content='This allows you to filter patients by patient number and inventory name.'
              inverted
            />
            {
              loading ? 
                <Loader inline active />
                :
                <span onClick={download}>
                  <Icon name="download" />
                  Download
                  <Icon name="file excel" />
                </span>
            }
          </div>

          <div className='date-controls'>
            <Input type="date" label={{ basic: true, content: 'From' }} labelPosition='left'
              onChange={handleMinDateFilter} max={maxDateFilter} />
            <Input type="date" label={{ basic: true, content: 'To' }} labelPosition='left'
              onChange={handleMaxDateFilter} min={minDateFilter} />
          </div>

          <div className='filters'>
            <span>
              <span>Inventory Type:</span>
              <Dropdown inline options={getFilters(inventoryTypes)} search
                onChange={handleInventoryFilter} value={inventoryFilter} id={COMPONENT_IDS.INVENTORY_TYPE}/>
            </span>
            <span>
              <span>Dispense Type:</span>
              <Dropdown inline options={getFilters(dispenseTypes)} search
                onChange={handleDispenseTypeFilter} value={dispenseTypeFilter} id={COMPONENT_IDS.DISPENSE_TYPE}/>
            </span>
            <span>
              <span>Site:</span>
              <Dropdown inline options={getFilters(sites)} search
                onChange={handleSiteFilter} value={siteFilter} id={COMPONENT_IDS.DISPENSE_SITE}/>
            </span>
          </div>

          <Divider/>

          <div>
            Records per page:{' '}
            <Dropdown inline={true} options={logPerPage} value={maxLog} onChange={handleMaxLog}/>
            Total count: {filterHistoricals.length}
          </div>

          <div className='table-wrapper'>
            <Table striped color='blue' unstackable>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Date & Time</Table.HeaderCell>
                  <Table.HeaderCell>Inventory Type</Table.HeaderCell>
                  <Table.HeaderCell>Dispense Type</Table.HeaderCell>
                  <Table.HeaderCell>Patient Number</Table.HeaderCell>
                  <Table.HeaderCell>Site</Table.HeaderCell>
                  <Table.HeaderCell>Dispensed By</Table.HeaderCell>
                  <Table.HeaderCell />
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
                  <Table.HeaderCell colSpan="7">
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
          </div>
        </Segment>
      </Container>
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
