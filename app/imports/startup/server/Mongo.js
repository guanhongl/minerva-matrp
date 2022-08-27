import { Meteor } from 'meteor/meteor';
import { Stuffs } from '../../api/stuff/StuffCollection';
import { Drugs } from '../../api/drug/DrugCollection';
import { DrugNames } from '../../api/drugName/DrugNameCollection';
import { DrugTypes } from '../../api/drugType/DrugTypeCollection';
import { Units } from '../../api/unit/UnitCollection';
import { DrugBrands } from '../../api/drugBrand/DrugBrandCollection';
import { VaccineNames } from '../../api/vaccineName/VaccineNameCollection';
import { VaccineBrands } from '../../api/vaccineBrand/VaccineBrandCollection';
import { SupplyNames } from '../../api/supplyName/SupplyNameCollection';
import { Locations } from '../../api/location/LocationCollection';
import { Sites } from '../../api/site/SiteCollection';
import { Historicals } from '../../api/historical/HistoricalCollection';
import { Supplys } from '../../api/supply/SupplyCollection';
import { Vaccines } from '../../api/vaccine/VaccineCollection';
import { DispenseTypes } from '../../api/dispense-type/DispenseTypeCollection';
/* eslint-disable no-console */

// Initialize the database with a default data document.
function addData(data) {
  console.log(`  Adding: ${data.name} (${data.owner})`);
  Stuffs.define(data);
}

const assetsFileName = 'data.json';
const jsonData = JSON.parse(Assets.getText(assetsFileName));
const sampleMedication = JSON.parse(Assets.getText('drug_subsample.json'));
const sampleSupply = JSON.parse(Assets.getText('supply_subsample.json'));
const sampleHistorical = JSON.parse(Assets.getText('historical_subsample.json'));
const sampleVaccines = JSON.parse(Assets.getText('vaccine_subsample.json'));
const drugNames = JSON.parse(Assets.getText('drug_names.json'));
const drugBrands = JSON.parse(Assets.getText('drug_brands.json'));
const vaccineNames = JSON.parse(Assets.getText('vaccine_names.json'));
const vaccineBrands = JSON.parse(Assets.getText('vaccine_brands.json'));
const supplyNames = JSON.parse(Assets.getText('supply_names.json'));

// Initialize the StuffsCollection if empty.
if (Stuffs.count() === 0) {
  if (Meteor.settings.defaultData) {
    console.log('Creating default data.');
    Meteor.settings.defaultData.map(data => addData(data));
  }
}

// if (Meteor.settings.loadAssetsFile && Drugs.count() === 0) {
//   console.log('Loading medications from private/drug_subsample.json');
//   sampleMedication.map(medication => Drugs.define(medication));
// }
// if (Meteor.settings.loadAssetsFile && Vaccines.count() === 0) {
//   console.log('Loading vaccines from private/vaccine_subsample.json');
//   sampleVaccines.map(vaccine => Vaccines.define(vaccine));
// }
// if (Meteor.settings.loadAssetsFile && Supplys.count() === 0) {
//   console.log('Loading supplies from private/supply_subsample.json');
//   sampleSupply.map(supply => Supplys.define(supply));
// }

if (Meteor.settings.loadAssetsFile) {
  if (Historicals.count() === 0) {
    console.log('Loading history from private/historical_subsample.json');
    sampleHistorical.slice(0, 200).map(historical => Historicals.define(historical));
  }

  if (DrugNames.count() === 0) {
    console.log('Loading DrugNames...');
    drugNames.map(o => DrugNames.define(o.drugName));
  }

  if (DrugTypes.count() === 0) {
    console.log(`Loading drugTypes from private/${assetsFileName}`);
    jsonData.drugTypes.map(o => DrugTypes.define(o.drugType));
  }

  if (Units.count() === 0) {
    console.log(`Loading units from private/${assetsFileName}`);
    jsonData.units.map(o => Units.define(o.unit));
  }

  if (DrugBrands.count() === 0) {
    console.log('Loading DrugBrands...');
    drugBrands.map(o => DrugBrands.define(o));
  }

  if (VaccineNames.count() === 0) {
    console.log('Loading VaccineNames...');
    vaccineNames.map(o => VaccineNames.define(o.vaccineName));
  }

  if (VaccineBrands.count() === 0) {
    console.log('Loading VaccineBrands...');
    vaccineBrands.map(o => VaccineBrands.define(o.vaccineBrand));
  }

  if (SupplyNames.count() === 0) {
    console.log('Loading SupplyNames...');
    supplyNames.map(o => SupplyNames.define(o.supplyName));
  }

  if (Locations.count() === 0) {
    console.log(`Loading locations from private/${assetsFileName}`);
    jsonData.locations.map(o => Locations.define(o));
  }

  if (Sites.count() === 0) {
    console.log(`Loading sites from private/${assetsFileName}`);
    jsonData.sites.map(o => Sites.define(o.site));
  }

  if (DispenseTypes.count() === 0) {
    console.log(`Loading dispense types from private/${assetsFileName}`);
    jsonData.dispenseTypes.map(o => DispenseTypes.define(o.dispenseType));
  }
}