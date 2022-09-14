import * as pulumi from '@pulumi/pulumi';
import * as random from "@pulumi/random";

let config = new pulumi.Config();
let name = config.require("name");
const pet = new random.RandomPet(name);

export const petName = pet.id;
