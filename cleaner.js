function cleanH2K(xml, name) {   
    // Checking that the file is an .h2k file
    var name_length = name.length
    if (name.slice(name_length - 4, name_length) != '.h2k') {
        console.log(name, 'is not an H2K file');
        return false;
    }
    
    console.log(`Reading ${name}`);
    return anonymize(xml);
}


function anonymize(xml) {
    //Step 1: Find the necessary values
    var ownership = getTagCode(xml, 'Ownership');
    var province = getTagInnerData(xml, 'Province');
    var province_code = getTagCode(xml, 'Province'); //Some versions have province code
    var city = getTagInnerData(xml, 'City');
    var postal = getTagInnerData(xml, 'PostalCode');
    postal = postal.slice(0, 3); //only the first three true characters of the postal code
    if (postal.length) postal += '9X9' // 9X9 is added to the postal code above because HOT2000 errors if the Postal code is incompvare


    //Step 2: Fill in the blank templates
    var new_File = writeFile(ownership);
    var new_Client = writeClient(postal, province, city, province_code);

    //Step 3: Replace the old with the new
    var old_File = getTagInnerData(xml, 'File'); //Indexes of the old "File" tag
    var old_Client = getTagInnerData(xml, 'Client');
    xml = xml.replace(old_File, new_File);
    xml = xml.replace(old_Client, new_Client);

    return xml
}

function writeFile(ownership) {
    return `
        <Identification></Identification>
        <PreviousFileId></PreviousFileId>
        <EnrollmentId></EnrollmentId>
        <Ownership code="${ownership}">
        </Ownership>
        <TaxNumber></TaxNumber>
        <EnteredBy></EnteredBy>
        <Company></Company>
        <BuilderName></BuilderName>
    `
}

function writeClient(postal, province, city, province_code) {
    return `
    <Name>
    <First></First>
    <Last></Last>
    </Name>
    <Telephone></Telephone>
    <StreetAddress>
        <Street>Redacted by StepWin h2kAnonymizer</Street>
        <City>${city}</City>
        <Province ${province_code? 'code='+province_code : '' } >
            ${province}
        </Province>
        <PostalCode>${postal}</PostalCode>
    </StreetAddress>
    <MailingAddress>
        <Name></Name>
        <Street>Last 3 postal code characters redacted</Street>
        <City>${city}</City>
        <Province>${province}</Province>
        <PostalCode>${postal}</PostalCode>
    </MailingAddress>
    `
}

function getTagInnerData(xml, tag) { //returns whatever is wrapped in an xml tag
    var indexes = findTagInnerIndexes(xml, tag);
    if (indexes.self_closing) return "";
    return xml.slice(indexes.start, indexes.end);
}

function findTagInnerIndexes(xml, tag) { //CAUTION: Case-sensitive
    // console.log('doing tag', tag);
    var opening = xml.indexOf(`<${tag}`);
    var start = xml.indexOf('>', opening) + 1; //find the ">" after the opening of the tag
    var end = xml.indexOf(`</${tag}`);
    var self_closing = end === -1 ? true : false;
    if (start > end && !self_closing) throw new Error(' File is possibly corrupt ');
    return {
        start,
        end,
        self_closing
    }
}

function getTagCode(xml, tag) {
    var identifier = `<${tag} code="`
    var start = xml.indexOf(identifier) + identifier.length;
    var end = xml.indexOf('"', start)
    return xml.slice(start, end)
}