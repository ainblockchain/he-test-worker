# HE-TEST-WORKER
* Homomorphic Encryption Test Worker
  * Performs computations on encrypted data without decrypting it through REST API and blockchain network

## How to run
### Build docker image
```
docker build -t he-test-worker .
```

### Run image as a container
```
docker run -dp [EXPOSED_PORT]:3000 he-test-worker
```

## Homomorphic Encryption
* Use [ain-js](https://github.com/ainblockchain/ain-js/tree/master/src/he)
### Encrypt data 
```
import Ain from '@ainblockchain/ain-js';

const ain = new Ain('http://node.ainetwork.ai:8080');
await ain.he.init();
const TEST_DATA = Float64Array.from({ length: ain.he.seal.encoder.slotCount }).map((x, i) => i);
const cipherText = ain.he.encrypt(TEST_DATA);
const encrypted = cipherText.save(); // base64 string
```
### Decrypt result
```
import Ain from '@ainblockchain/ain-js';

const ain = new Ain('http://node.ainetwork.ai:8080');
await ain.he.init();
const result = ... // get result from he-test-worker
const decrypted = ain.he.decrypt(result); // decrypted as Float64Array format
```

## APIs
### [POST] `/he/double`
* Body parameters
  * `operand`: encrypted base64 string
* Response
  * `result`: encrypted base64 string
    * encrypted result of `operand * 2`
### [POST] `/he/add`
* Body parameters
  * `operand1`: encrypted base64 string
  * `operand2`: encrypted base64 string
* Response
  * `result`: encrypted base64 string
    * encrypted result of `operand1 + operand2`