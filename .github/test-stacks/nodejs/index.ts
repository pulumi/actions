import * as pulumi from '@pulumi/pulumi';
import * as random from "@pulumi/random";

let config = new pulumi.Config();
let name = config.require("name");
const pet = new random.RandomPet(name);

pulumi.log.debug("I'm a random pet", pet)

export const petName = pet.id;
