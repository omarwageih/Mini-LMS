const bcrypt = require('bcryptjs');
const hashInDB = '$2b$10$NGdk40K63vZ.x7n4vBK6uu2ery/egNiIjAWj8bUtLIVwlSHV3D71i';
const passwordToTest = '123456';

async function test() {
    const isMatch = await bcrypt.compare(passwordToTest, hashInDB);
    console.log(`Password "123456" match with DB hash: ${isMatch}`);
}
test();
