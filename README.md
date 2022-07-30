# The Vault (Level 2)
The Vault program that functions like a dead man’s switch. It should allow the Deployer to
deposit some large amount of tokens. It should then ask the Deployer to press the switch. If the
Deployer presses the button, the contract should return the funds to them. If the Deployer does
not press the switch then it transfers the funds to the Attacher.