// Master item catalog: name + inventory code, taken from Van_Essentials.xlsx.
export const ITEMS = [
  ['Cash Drawer J-423-B-RJ: Smart Series 16"', 1003],
  ['Cash Drawer - 13 Inch + Cable - EP-1313-M-B-4B5C', 1987],
  ['A3700 Hub', 1109],
  ['POS360 Register Keyboard', 3038],
  ['A35 Metal Stand', 1048],
  ['A30 Metal Stand', 1054],
  ['A3700 Metal Stand', 1111],
  ['Honeywell Genesis - 7680 Wired Scanner - USB Kit w EasyDL', 3033],
  ['Honeywell Wireless 2D Imaging Scanner + Docking Station', 3029],
  ['WiFi Extender - TP-Link', 3048],
  ['Hanasis HIT 156 15.6" Glass PCAP N5095 2.0, 16 GBRAM, 256 GB SSD, No base, No MSR Blk AIO', 3022],
  ['Matsuda ST8500 - 15.6 Inch Computer', 3055],
  ['PAX SP30 - PAYSAFE - BLK', 3004],
  ['PAX SP30 - FD - BLK', 3002],
  ['PAX SP30 - BLK - TSYS', 3013],
  ['PAX S80', 3005],
  ['PAX Elys Pin Pad A3700 - FD', 3102],
  ['PAX A6650 Tablet - TSYS', 3095],
  ['PAX A30 TSYS', 3098],
  ['PAX Pin Pad A3700 - TSYS', 3094],
  ['PAX A920 - TSYS', 3034],
  ['PAX A920 - FD', 3028],
  ['PAX A35 - TSYS', 3031],
  ['PAX A35 - FD', 3032],
  ['Aures ODB-333 Receipt Printer', 2007],
  ['GoDex DT200 Direct Thermal Deal Tag Printer w/Autocutter', 2005],
  ['GoDEX RT200 - Thermal Transfer Shelf Tag Printer', 2001],
  ['GoDex DT2X Thermal Printer', 2002],
  ['Epson - TM-m30III - Receipt Printer - EPS-C31CK50012', 2006],
  ['Epson TM-L90 II Liner-Free Thermal Label Printer', 2016],
  ['Bixolon SAM-SRP-275IIICOESG - Impact Kitchen Printer', 2015],
  ['360 Tablet', 3044],
  ['Magellan 9600i Scanner/Scale - Long Platter', 3053],
  ['Brecknell 6720U-15 30Lbs Scale', 3023],
  ['CAS PD-II 30lb - CSU-PD-2ZS-(30LB) + CSU-JL14 USB Cable', 3024],
  ['13 Inch Customer LCD Monitor', 3042],
  ['Cradlepoint S700 Router', 3026],
  ['Cradlepoint IBR600C', 3059],
  ['360 Pro (S)', 9015],
  ['360 Pro (P)', 9013],
  ['POS360 Customer LCD Kit w/Lid + Cables', 3060],
  ['POS360 Customer LCD Kit', 3999],
  ['360 Pro - Power Supply', 9019],
];

// The 9 van identifiers. First 2 characters = location prefix, remaining 3 = the van's own code.
export const VAN_CODES = [
  'AH2Z3',
  'AH7D4',
  'AH6D4',
  'NC0E3',
  'SD0A3',
  'AHC26',
  'AHG22',
  'AHC27',
  'AHC28',
];

export const LOCATIONS = [
  ['AH', 'Agoura Hills'],
  ['NC', 'Nor Cal'],
  ['SD', 'San Diego'],
];

export function splitVanCode(code) {
  return { prefix: code.slice(0, 2), suffix: code.slice(2) };
}
