package main

import (
	"context"
	"flag"
	"github.com/dop251/goja"
	"github.com/dop251/goja_nodejs/console"
	"github.com/dop251/goja_nodejs/require"
	highbase "github.com/pb33f/libopenapi/datamodel/high/base"
	"github.com/pb33f/libopenapi/datamodel/low"
	lowbase "github.com/pb33f/libopenapi/datamodel/low/base"
	"gopkg.in/yaml.v3"
	"log"
	"os"
)

func loadJsonSchema(data string) *highbase.Schema {
	var node yaml.Node
	_ = yaml.Unmarshal([]byte(data), &node)
	var lowSchema lowbase.Schema
	_ = low.BuildModel(node.Content[0], &lowSchema)
	_ = lowSchema.Build(context.Background(), node.Content[0], nil)
	return highbase.NewSchema(&lowSchema)
}

func runTemplate(templPath string) {
	vm := goja.New()
	vm.Set("jsonschema", loadJsonSchema)

	registry := new(require.Registry)
	registry.Enable(vm)
	console.Enable(vm)

	templBytes, err := os.ReadFile(templPath)
	if err != nil {
		log.Fatalln(err)
	}

	_, err = vm.RunString(string(templBytes))
	if err != nil {
		log.Fatalln(err)
	}
}

func main() {
	templPath := flag.String("templ", "template.js", "template file (javascript)")
	flag.Parse()

	runTemplate(*templPath)
}
