import {loadStdlib, ask} from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
const stdlib = loadStdlib(process.env);

const startingBalance = stdlib.parseCurrency(10000);

const [ accAlice, accBob ] =
  await stdlib.newTestAccounts(2, startingBalance);

const fmt = (x) => stdlib.formatCurrency(x, 4);
const getBalance = async(who) => fmt(await stdlib.balanceOf(who));

const startBalAlice = await getBalance(accAlice);
const startBalBob = await getBalance(accBob);

console.log(`Starting balance of Alice: ${startBalAlice}`);
console.log(`Starting balance of Bob: ${startBalBob}`);
 
const ctcAlice = accAlice.contract(backend);
const ctcBob = accBob.contract(backend, ctcAlice.getInfo());

const sharedFunctions = (who) => ({
  showDeadline: (deadline) => {
    console.log(`${who} saw the timer deadline: ${deadline}`);
  },
  informTimeout: () => {
    console.log(`${who} observed a timeout!`);
    process.exit(1);
  },
  showPresence: (round, presence) => {
    // If round is 0 then it means it is the final round
    const roundDetails = parseInt(round) === 0? 'Final': round;

    const outcome = presence? 'present': 'absent';

    console.log(`Round ${roundDetails}: ${who} saw Alice is ${outcome}`);
  }
});

console.log('Starting backends...');
await Promise.all([
  backend.Alice(ctcAlice, {
    ...stdlib.hasRandom,
    ...stdlib.hasConsoleLogger,
    ...sharedFunctions('Alice'),
    // implement Alice's interact object here
    addFunds: async() => {
      const amount = await ask.ask(`Alice: Please enter the amount of funds you want to add to contract (Amount must be greater than 4999):`, parseInt);
      console.log(`Transferring amount: ${amount}`);
      return stdlib.parseCurrency(amount);
    },
    presenceCheck: async() => {
      const presence = await ask.ask(`Alice: Are you still there?:`, ask.yesno);
      return presence;
    }
  }),
  backend.Bob(ctcBob, {
    ...stdlib.hasRandom,
    ...sharedFunctions('Bob'),
    // implement Bob's interact object here
    acceptTerms: async() => {
      const accepted = await ask.ask(`Bob: Do you accept the terms of the vault?:`, ask.yesno);
      if (!accepted) {
        process.exit(1);
      }
      return accepted;
    }
  }),
]);

const endBalAlice = await getBalance(accAlice);
const endBalBob = await getBalance(accBob);

console.log(`End balance of Alice: ${endBalAlice}`);
console.log(`End balance of Bob: ${endBalBob}`);

ask.done();
console.log('Goodbye, Alice and Bob!');
