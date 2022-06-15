import { Meteor } from 'meteor/meteor';
import { Stuffs } from '../../api/stuff/StuffCollection';
import { Drugs } from '../../api/drug/DrugCollection';
import { DrugTypes } from '../../api/drugType/DrugTypeCollection';
import { Locations } from '../../api/location/LocationCollection';
import { Sites } from '../../api/site/SiteCollection';
import { Historicals } from '../../api/historical/HistoricalCollection';
import { Supplys } from '../../api/supply/SupplyCollection';
import { Vaccines } from '../../api/vaccine/VaccineCollection';
/* eslint-disable no-console */

// Initialize the database with a default data document.
function addData(data) {
  console.log(`  Adding: ${data.name} (${data.owner})`);
  Stuffs.define(data);
}

const assetsFileName = 'data.json';
const jsonData = JSON.parse(Assets.getText(assetsFileName));
const sampleMedication = JSON.parse(Assets.getText('sample_drug.json'));
const sampleSupply = JSON.parse(Assets.getText('sample_supply.json'));
const sampleHistorical = JSON.parse(Assets.getText('historicals.json'));
const sampleVaccines = JSON.parse(Assets.getText('sample_vaccines.json'));

// Initialize the StuffsCollection if empty.
if (Stuffs.count() === 0) {
  if (Meteor.settings.defaultData) {
    console.log('Creating default data.');
    Meteor.settings.defaultData.map(data => addData(data));
  }
}

// if (Meteor.settings.loadAssetsFile && Drugs.count() === 0) {
//   console.log('Loading medications from private/sample_drug.json');
//   // jsonData.medications.map(medication => Drugs.define(medication));
//   sampleMedication.map(medication => Drugs.define(medication));
// }

if (Meteor.settings.loadAssetsFile && Historicals.count() === 0) {
  console.log('Loading history from private/historicals.json');
  sampleHistorical.slice(0, 500).map(historical => Historicals.define(historical));
}

if (Meteor.settings.loadAssetsFile && DrugTypes.count() === 0) {
  console.log(`Loading drugTypes from private/${assetsFileName}`);
  jsonData.drugTypes.map(drugType => DrugTypes.define(drugType));
}

if (Meteor.settings.loadAssetsFile && Locations.count() === 0) {
  console.log(`Loading locations from private/${assetsFileName}`);
  jsonData.locations.map(location => Locations.define(location));
}

if (Meteor.settings.loadAssetsFile && Sites.count() === 0) {
  console.log(`Loading sites from private/${assetsFileName}`);
  jsonData.sites.map(site => Sites.define(site));
}

// if (Meteor.settings.loadAssetsFile && Supplys.count() === 0) {
//   console.log('Loading supplies from private/sample_supply.json');
//   sampleSupply.map(supply => Supplys.define(supply));
// }

// if (Meteor.settings.loadAssetsFile && Vaccines.count() === 0) {
//   console.log('Loading vaccines from private/sample_vaccines.json');
//   sampleVaccines.map(vaccine => Vaccines.define(vaccine));
// }
