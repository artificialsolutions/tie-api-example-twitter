@description('Specifies the location for resources.')
param location string = resourceGroup().location

resource storageAccount 'Microsoft.Storage/storageAccounts@2022-05-01' = {
  name:'ASOLTwitterConnector'
  location:location
  sku: { 
    name:'Standard_LRS'    
  }
  kind:'StorageV2'
  properties: {
    accessTier:'Hot'
  }
}

