'reach 0.1';

const sharedFunctions = {
  showDeadline: Fun([UInt], Null),
  informTimeout: Fun([], Null),
  showPresence: Fun([UInt, Bool], Null)
};

export const main = Reach.App(() => {
  const A = Participant('Alice', {
    ...sharedFunctions,
    ...hasConsoleLogger,
    // Specify Alice's interact interface here
    addFunds: Fun([], UInt),
    presenceCheck: Fun([], Bool),
  });
  const B = Participant('Bob', {
    ...sharedFunctions,
    // Specify Bob's interact interface here
    acceptTerms: Fun([], Bool),
  });
  init();

  const informTimeout = () => {
    each([A, B], () => {
      interact.informTimeout();
    });
  };

  // The first one to publish deploys the contract
  A.only(() => {
    const funds = declassify(interact.addFunds());
    const timerValue = 10;
    check(funds > 4999);
  });
  A.publish(funds, timerValue).pay(funds);
  commit();
  // The second one to publish always attaches
  B.only(() => {
    const accepted = declassify(interact.acceptTerms());
  });
  B.publish(accepted)
    .timeout(relativeTime(10), () => closeTo(A, informTimeout));
  commit();

  each([A,B], () => {
    interact.showDeadline(timerValue);
  });

  A.only(() => {
    const present = declassify(interact.presenceCheck());
  });
  A.publish(present)
    .timeout(relativeTime(10), () => closeTo(B, informTimeout));

  const futureTime = lastConsensusTime() + timerValue;

  var [currentTime, stillHere, round] =  [lastConsensusTime(), false, 1];

  invariant(balance() == funds);

  while(currentTime != futureTime){
    commit();
    // Check if Alice is still here
    A.only(() => {
      const newAttendance = declassify(interact.presenceCheck());
    });
    A.publish(newAttendance);

    // Show the outcome of each round
    each([A, B], () => {
      interact.showPresence(round, newAttendance);
    });

    [currentTime, stillHere, round] = [currentTime + 1, newAttendance, round + 1];
    continue;
  } 

  // We set the round to 0 to signify the final round, a check is made in the frontend
  each([A, B], () => {
    interact.showPresence(0, stillHere);
  });

  const [forAlice, forBob] = stillHere? [1, 0]: [0, 1];

  check(balance() == funds);
  transfer(forAlice * funds).to(A);
  transfer(forBob * funds).to(B);
  commit();
  
  exit();
});
