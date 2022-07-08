package main

import (
	random "github.com/pulumi/pulumi-random/sdk/v4/go/random"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		conf := config.New(ctx, "")
		name := conf.Require("name")
		s, err := random.NewRandomString(ctx, name, &random.RandomStringArgs{
			Length: pulumi.Int(60),
		})
		if err != nil {
			return err
		}
		ctx.Export("name", s.Result)
		return nil
	})
}
