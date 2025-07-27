import pulumi
import pulumi_random as random

config = pulumi.Config()
name = config.require("name")
random_host_name = random.RandomPet(name)

pulumi.debug("I'm a random pet", random_host_name)

pulumi.export("name", random_host_name.id)
