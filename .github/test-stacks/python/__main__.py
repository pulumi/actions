import pulumi
import pulumi_random as random

config = pulumi.Config()
name = config.require("name")
random_host_name = random.RandomPet(name)

pulumi.export("name", random_host_name.id)
