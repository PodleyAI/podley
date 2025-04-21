/** Set of valid State and Country Codes according to EDGAR. */
export type StateOrCountryCode =
  | "AL"
  | "AK"
  | "AZ"
  | "AR"
  | "CA"
  | "CO"
  | "CT"
  | "DE"
  | "DC"
  | "FL"
  | "GA"
  | "HI"
  | "ID"
  | "IL"
  | "IN"
  | "IA"
  | "KS"
  | "KY"
  | "LA"
  | "ME"
  | "MD"
  | "MA"
  | "MI"
  | "MN"
  | "MS"
  | "MO"
  | "MT"
  | "NE"
  | "NV"
  | "NH"
  | "NJ"
  | "NM"
  | "NY"
  | "NC"
  | "ND"
  | "OH"
  | "OK"
  | "OR"
  | "PA"
  | "RI"
  | "SC"
  | "SD"
  | "TN"
  | "TX"
  | "X1"
  | "UT"
  | "VT"
  | "VA"
  | "WA"
  | "WV"
  | "WI"
  | "WY"
  | "A0"
  | "A1"
  | "A2"
  | "A3"
  | "A4"
  | "A5"
  | "A6"
  | "A7"
  | "A8"
  | "A9"
  | "B0"
  | "Z4"
  | "B2"
  | "Y6"
  | "B3"
  | "B4"
  | "B5"
  | "B6"
  | "B7"
  | "1A"
  | "B8"
  | "B9"
  | "C1"
  | "1B"
  | "1C"
  | "C3"
  | "C4"
  | "1D"
  | "C5"
  | "C6"
  | "C7"
  | "C8"
  | "1F"
  | "C9"
  | "D1"
  | "G6"
  | "D0"
  | "D2"
  | "D3"
  | "1E"
  | "B1"
  | "D4"
  | "D5"
  | "D6"
  | "D9"
  | "E0"
  | "X2"
  | "E2"
  | "E3"
  | "E4"
  | "E8"
  | "E9"
  | "F0"
  | "F2"
  | "F3"
  | "F4"
  | "F6"
  | "F7"
  | "F8"
  | "F9"
  | "G0"
  | "Y3"
  | "G1"
  | "G2"
  | "L7"
  | "1M"
  | "G3"
  | "G4"
  | "2N"
  | "G7"
  | "1G"
  | "G9"
  | "G8"
  | "H1"
  | "H2"
  | "H3"
  | "H4"
  | "1J"
  | "1H"
  | "H5"
  | "H7"
  | "H6"
  | "H8"
  | "H9"
  | "I0"
  | "I3"
  | "I4"
  | "2C"
  | "I5"
  | "I6"
  | "2Q"
  | "2M"
  | "J0"
  | "J1"
  | "J3"
  | "J4"
  | "J5"
  | "J6"
  | "GU"
  | "J8"
  | "Y7"
  | "J9"
  | "S0"
  | "K0"
  | "K1"
  | "K4"
  | "X4"
  | "K2"
  | "K3"
  | "K5"
  | "K6"
  | "K7"
  | "K8"
  | "K9"
  | "L0"
  | "L2"
  | "Y8"
  | "L3"
  | "L6"
  | "L8"
  | "M0"
  | "Y9"
  | "M2"
  | "1P"
  | "M3"
  | "J2"
  | "M4"
  | "M5"
  | "M6"
  | "1N"
  | "M7"
  | "1R"
  | "M8"
  | "M9"
  | "N0"
  | "N1"
  | "N2"
  | "1Q"
  | "N4"
  | "N5"
  | "1U"
  | "N6"
  | "N7"
  | "N8"
  | "N9"
  | "O0"
  | "O1"
  | "1T"
  | "O2"
  | "O3"
  | "O4"
  | "2P"
  | "O5"
  | "1K"
  | "1S"
  | "O9"
  | "P0"
  | "Z5"
  | "P1"
  | "P2"
  | "P3"
  | "E1"
  | "T6"
  | "P5"
  | "P6"
  | "P7"
  | "P8"
  | "1W"
  | "Q2"
  | "Q3"
  | "Q4"
  | "Q5"
  | "Q6"
  | "Q7"
  | "1V"
  | "Q8"
  | "P4"
  | "R0"
  | "1Y"
  | "1X"
  | "R1"
  | "R2"
  | "R4"
  | "R5"
  | "R6"
  | "R8"
  | "R9"
  | "S1"
  | "PR"
  | "S3"
  | "S4"
  | "S5"
  | "1Z"
  | "S6"
  | "Z0"
  | "U8"
  | "U7"
  | "U9"
  | "Z1"
  | "V0"
  | "V1"
  | "Y0"
  | "S8"
  | "S9"
  | "T0"
  | "T1"
  | "Z2"
  | "T2"
  | "T8"
  | "U0"
  | "2B"
  | "2A"
  | "D7"
  | "U1"
  | "T3"
  | "1L"
  | "U3"
  | "F1"
  | "V2"
  | "V3"
  | "L9"
  | "V6"
  | "V7"
  | "V8"
  | "V9"
  | "F5"
  | "2D"
  | "W0"
  | "W1"
  | "Z3"
  | "W2"
  | "W3"
  | "W4"
  | "W5"
  | "W6"
  | "W8"
  | "2E"
  | "W7"
  | "2G"
  | "W9"
  | "2H"
  | "C0"
  | "X0"
  | "2J"
  | "X3"
  | "2K"
  | "2L"
  | "X5"
  | "Q1"
  | "D8"
  | "VI"
  | "X8"
  | "U5"
  | "T7"
  | "Y4"
  | "Y5"
  | "XX";

/** Set of valid State and Territory Codes for Form D Section 12. */
export type StateSolicitationCode =
  | "AL"
  | "AK"
  | "AZ"
  | "AR"
  | "CA"
  | "CO"
  | "CT"
  | "DE"
  | "DC"
  | "FL"
  | "GA"
  | "HI"
  | "ID"
  | "IL"
  | "IN"
  | "IA"
  | "KS"
  | "KY"
  | "LA"
  | "ME"
  | "MD"
  | "MA"
  | "MI"
  | "MN"
  | "MS"
  | "MO"
  | "MT"
  | "NE"
  | "NV"
  | "NH"
  | "NJ"
  | "NM"
  | "NY"
  | "NC"
  | "ND"
  | "OH"
  | "OK"
  | "OR"
  | "PA"
  | "RI"
  | "SC"
  | "SD"
  | "TN"
  | "TX"
  | "UT"
  | "VT"
  | "VA"
  | "WA"
  | "WV"
  | "WI"
  | "WY"
  | "PR";

export enum StateSolicitationCodeEnum {
  AL = "AL",
  AK = "AK",
  AZ = "AZ",
  AR = "AR",
  CA = "CA",
  CO = "CO",
  CT = "CT",
  DE = "DE",
  DC = "DC",
  FL = "FL",
  GA = "GA",
  HI = "HI",
  ID = "ID",
  IL = "IL",
  IN = "IN",
  IA = "IA",
  KS = "KS",
  KY = "KY",
  LA = "LA",
  ME = "ME",
  MD = "MD",
  MA = "MA",
  MI = "MI",
  MN = "MN",
  MS = "MS",
  MO = "MO",
  MT = "MT",
  NE = "NE",
  NV = "NV",
  NH = "NH",
  NJ = "NJ",
  NM = "NM",
  NY = "NY",
  NC = "NC",
  ND = "ND",
  OH = "OH",
  OK = "OK",
  OR = "OR",
  PA = "PA",
  RI = "RI",
  SC = "SC",
  SD = "SD",
  TN = "TN",
  TX = "TX",
  UT = "UT",
  VT = "VT",
  VA = "VA",
  WA = "WA",
  WV = "WV",
  WI = "WI",
  WY = "WY",
  PR = "PR",
}
export enum StateOrCountryEnum {
  "AL" = "Alabama",
  "AK" = "Alaska",
  "AZ" = "Arizona",
  "AR" = "Arkansas",
  "CA" = "California",
  "CO" = "Colorado",
  "CT" = "Connecticut",
  "DE" = "Delaware",
  "DC" = "District of Columbia",
  "FL" = "Florida",
  "GA" = "Georgia",
  "HI" = "Hawaii",
  "ID" = "Idaho",
  "IL" = "Illinois",
  "IN" = "Indiana",
  "IA" = "Iowa",
  "KS" = "Kansas",
  "KY" = "Kentucky",
  "LA" = "Louisiana",
  "ME" = "Maine",
  "MD" = "Maryland",
  "MA" = "Massachusetts",
  "MI" = "Michigan",
  "MN" = "Minnesota",
  "MS" = "Mississippi",
  "MO" = "Missouri",
  "MT" = "Montana",
  "NE" = "Nebraska",
  "NV" = "Nevada",
  "NH" = "New Hampshire",
  "NJ" = "New Jersey",
  "NM" = "New Mexico",
  "NY" = "New York",
  "NC" = "North Carolina",
  "ND" = "North Dakota",
  "OH" = "Ohio",
  "OK" = "Oklahoma",
  "OR" = "Oregon",
  "PA" = "Pennsylvania",
  "RI" = "Rhode Island",
  "SC" = "South Carolina",
  "SD" = "South Dakota",
  "TN" = "Tennessee",
  "TX" = "Texas",
  "X1" = "United States",
  "UT" = "Utah",
  "VT" = "Vermont",
  "VA" = "Virginia",
  "WA" = "Washington",
  "WV" = "West Virginia",
  "WI" = "Wisconsin",
  "WY" = "Wyoming",
  "A0" = "Alberta= Canada",
  "A1" = "British Columbia= Canada",
  "Z4" = "Canada (Federal Level)",
  "A2" = "Manitoba= Canada",
  "A3" = "New Brunswick= Canada",
  "A4" = "Newfoundland= Canada",
  "A5" = "Nova Scotia= Canada",
  "A6" = "Ontario= Canada",
  "A7" = "Prince Edward Island= Canada",
  "A8" = "Quebec= Canada",
  "A9" = "Saskatchewan= Canada",
  "B0" = "Yukon= Canada",
  "B2" = "Afghanistan",
  "Y6" = "Aland Islands",
  "B3" = "Albania",
  "B4" = "Algeria",
  "B5" = "American Samoa",
  "B6" = "Andorra",
  "B7" = "Angola",
  "1A" = "Anguilla",
  "B8" = "Antarctica",
  "B9" = "Antigua and Barbuda",
  "C1" = "Argentina",
  "1B" = "Armenia",
  "1C" = "Aruba",
  "C3" = "Australia",
  "C4" = "Austria",
  "1D" = "Azerbaijan",
  "C5" = "Bahamas",
  "C6" = "Bahrain",
  "C7" = "Bangladesh",
  "C8" = "Barbados",
  "1F" = "Belarus",
  "C9" = "Belgium",
  "D1" = "Belize",
  "G6" = "Benin",
  "D0" = "Bermuda",
  "D2" = "Bhutan",
  "D3" = "Bolivia",
  "1E" = "Bosnia and Herzegovina",
  "B1" = "Botswana",
  "D4" = "Bouvet Island",
  "D5" = "Brazil",
  "D6" = "British Indian Ocean Territory",
  "D9" = "Brunei Darussalam",
  "E0" = "Bulgaria",
  "X2" = "Burkina Faso",
  "E2" = "Burundi",
  "E3" = "Cambodia",
  "E4" = "Cameroon",
  "E8" = "Cape Verde",
  "E9" = "Cayman Islands",
  "F0" = "Central African Republic",
  "F2" = "Chad",
  "F3" = "Chile",
  "F4" = "China",
  "F6" = "Christmas Island",
  "F7" = "Cocos (Keeling) Islands",
  "F8" = "Colombia",
  "F9" = "Comoros",
  "G0" = "Congo",
  "Y3" = "Congo= the Democratic Republic of the",
  "G1" = "Cook Islands",
  "G2" = "Costa Rica",
  "L7" = "Cote D'ivoire ",
  "1M" = "Croatia",
  "G3" = "Cuba",
  "G4" = "Cyprus",
  "2N" = "Czech Republic",
  "G7" = "Denmark",
  "1G" = "Djibouti",
  "G9" = "Dominica",
  "G8" = "Dominican Republic",
  "H1" = "Ecuador",
  "H2" = "Egypt",
  "H3" = "El Salvador",
  "H4" = "Equatorial Guinea",
  "1J" = "Eritrea",
  "1H" = "Estonia",
  "H5" = "Ethiopia",
  "H7" = "Falkland Islands (Malvinas)",
  "H6" = "Faroe Islands",
  "H8" = "Fiji",
  "H9" = "Finland",
  "I0" = "France",
  "I3" = "French Guiana",
  "I4" = "French Polynesia",
  "2C" = "French Southern Territories",
  "I5" = "Gabon",
  "I6" = "Gambia",
  "2Q" = "Georgia",
  "2M" = "Germany",
  "J0" = "Ghana",
  "J1" = "Gibraltar",
  "J3" = "Greece",
  "J4" = "Greenland",
  "J5" = "Grenada",
  "J6" = "Guadeloupe",
  "GU" = "Guam",
  "J8" = "Guatemala",
  "Y7" = "Guernsey",
  "J9" = "Guinea",
  "S0" = "Guinea-bissau",
  "K0" = "Guyana",
  "K1" = "Haiti",
  "K4" = "Heard Island and Mcdonald Islands",
  "X4" = "Holy See (Vatican City State)",
  "K2" = "Honduras",
  "K3" = "Hong Kong",
  "K5" = "Hungary",
  "K6" = "Iceland",
  "K7" = "India",
  "K8" = "Indonesia",
  "K9" = "Iran= Islamic Republic of",
  "L0" = "Iraq",
  "L2" = "Ireland",
  "Y8" = "Isle of Man",
  "L3" = "Israel",
  "L6" = "Italy",
  "L8" = "Jamaica",
  "M0" = "Japan",
  "Y9" = "Jersey",
  "M2" = "Jordan",
  "1P" = "Kazakstan",
  "M3" = "Kenya",
  "J2" = "Kiribati",
  "M4" = "Korea= Democratic People's Republic of ",
  "M5" = "Korea= Republic of",
  "M6" = "Kuwait",
  "1N" = "Kyrgyzstan",
  "M7" = "Lao People's Democratic Republic ",
  "1R" = "Latvia",
  "M8" = "Lebanon",
  "M9" = "Lesotho",
  "N0" = "Liberia",
  "N1" = "Libyan Arab Jamahiriya",
  "N2" = "Liechtenstein",
  "1Q" = "Lithuania",
  "N4" = "Luxembourg",
  "N5" = "Macau",
  "1U" = "Macedonia= the Former Yugoslav Republic of",
  "N6" = "Madagascar",
  "N7" = "Malawi",
  "N8" = "Malaysia",
  "N9" = "Maldives",
  "O0" = "Mali",
  "O1" = "Malta",
  "1T" = "Marshall Islands",
  "O2" = "Martinique",
  "O3" = "Mauritania",
  "O4" = "Mauritius",
  "2P" = "Mayotte",
  "O5" = "Mexico",
  "1K" = "Micronesia= Federated States of",
  "1S" = "Moldova= Republic of",
  "O9" = "Monaco",
  "P0" = "Mongolia",
  "Z5" = "Montenegro",
  "P1" = "Montserrat",
  "P2" = "Morocco",
  "P3" = "Mozambique",
  "E1" = "Myanmar",
  "T6" = "Namibia",
  "P5" = "Nauru",
  "P6" = "Nepal",
  "P7" = "Netherlands",
  "P8" = "Netherlands Antilles",
  "1W" = "New Caledonia",
  "Q2" = "New Zealand",
  "Q3" = "Nicaragua",
  "Q4" = "Niger",
  "Q5" = "Nigeria",
  "Q6" = "Niue",
  "Q7" = "Norfolk Island",
  "1V" = "Northern Mariana Islands",
  "Q8" = "Norway",
  "P4" = "Oman",
  "R0" = "Pakistan",
  "1Y" = "Palau",
  "1X" = "Palestinian Territory= Occupied",
  "R1" = "Panama",
  "R2" = "Papua New Guinea",
  "R4" = "Paraguay",
  "R5" = "Peru",
  "R6" = "Philippines",
  "R8" = "Pitcairn",
  "R9" = "Poland",
  "S1" = "Portugal",
  "PR" = "Puerto Rico",
  "S3" = "Qatar",
  "S4" = "Reunion",
  "S5" = "Romania",
  "1Z" = "Russian Federation",
  "S6" = "Rwanda",
  "Z0" = "Saint Barthelemy",
  "U8" = "Saint Helena",
  "U7" = "Saint Kitts and Nevis",
  "U9" = "Saint Lucia",
  "Z1" = "Saint Martin",
  "V0" = "Saint Pierre and Miquelon",
  "V1" = "Saint Vincent and the Grenadines",
  "Y0" = "Samoa",
  "S8" = "San Marino",
  "S9" = "Sao Tome and Principe",
  "T0" = "Saudi Arabia",
  "T1" = "Senegal",
  "Z2" = "Serbia",
  "T2" = "Seychelles",
  "T8" = "Sierra Leone",
  "U0" = "Singapore",
  "2B" = "Slovakia",
  "2A" = "Slovenia",
  "D7" = "Solomon Islands",
  "U1" = "Somalia",
  "T3" = "South Africa",
  "1L" = "South Georgia and the South Sandwich Islands",
  "U3" = "Spain",
  "F1" = "Sri Lanka",
  "V2" = "Sudan",
  "V3" = "Suriname",
  "L9" = "Svalbard and Jan Mayen",
  "V6" = "Swaziland",
  "V7" = "Sweden",
  "V8" = "Switzerland",
  "V9" = "Syrian Arab Republic",
  "F5" = "Taiwan= Province of China",
  "2D" = "Tajikistan",
  "W0" = "Tanzania= United Republic of",
  "W1" = "Thailand",
  "Z3" = "Timor-leste",
  "W2" = "Togo",
  "W3" = "Tokelau",
  "W4" = "Tonga",
  "W5" = "Trinidad and Tobago",
  "W6" = "Tunisia",
  "W8" = "Turkey",
  "2E" = "Turkmenistan",
  "W7" = "Turks and Caicos Islands",
  "2G" = "Tuvalu",
  "W9" = "Uganda",
  "2H" = "Ukraine",
  "C0" = "United Arab Emirates",
  "X0" = "United Kingdom",
  "2J" = "United States Minor Outlying Islands",
  "X3" = "Uruguay",
  "2K" = "Uzbekistan",
  "2L" = "Vanuatu",
  "X5" = "Venezuela",
  "Q1" = "Viet Nam",
  "D8" = "Virgin Islands= British",
  "VI" = "Virgin Islands= U.s.",
  "X8" = "Wallis and Futuna",
  "U5" = "Western Sahara",
  "T7" = "Yemen",
  "Y4" = "Zambia",
  "Y5" = "Zimbabwe",
  "XX" = "Unknown",
}
