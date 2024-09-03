import yaml
import json

fileName = input("文件名:")
genType = input("方法:")
version = input("版本号:")

print('Generating: ', end='')
if fileName == 'typeIDs':
    if genType == '1':
        print('itemList')
    if genType == '2':
        print('idToGroup')
    if genType == '3':
        print('idToName')
    if genType == '4':
        print('structureList')
    if genType == '5':
        print('marketItemList')

if fileName == 'blueprints':
    if genType == '1':
        print('blueprints')
    if genType == '2':
        print('reactions')
    if genType == '3':
        print('all blueprints')

# print(fileName + '.yaml')
file = open(fileName + '.yml', 'rb')
outPut = open(fileName + '.json', 'w', encoding='utf8')
yamlStr = file.read()
file.close()

conv = {'version': version, 'payload': {}}
data = yaml.load(yamlStr, Loader=yaml.FullLoader)

# for key, val in data.items():
#    if val['nameID']['zh'] is not None:
#        conv[key] = val['nameID']['zh']

if fileName == 'types':
    # itemList
    if genType == '1':
        for key, val in data.items():
            if 'zh' in val['name']:
                if val['published']:
                    conv['payload'][val['name']['zh']] = key
    # idToGroup
    if genType == '2':
        for key, val in data.items():
            if 'zh' in val['name']:
                if val['published']:
                    if 'marketGroupID' in val:
                        conv['payload'][key] = val['marketGroupID']
    # idToName
    if genType == '3':
        for key, val in data.items():
            if 'zh' in val['name']:
                if val['published']:
                    conv['payload'][key] = val['name']['zh']
    # structureList
    if genType == '4':
        for key, val in data.items():
            if 'zh' in val['name']:
                if val['published']:
                    if 'traits' in val:
                        if 'roleBonuses' in val['traits']:
                            if 'marketGroupID' in val:
                                if val['marketGroupID'] in [2201, 2200, 2324, 2327]:
                                    conv['payload'][key] = {'me': 0, 'te': 0, 'name': val['name']['zh']}
                                    for v in val['traits']['roleBonuses']:
                                        if 'bonus' in v:
                                            if v['bonusText']['en'] == 'reduction in material requirements for manufacturing jobs':
                                                conv['payload'][key]['me'] = v['bonus']
                                            if v['bonusText']['en'] == 'reduction in time requirements for manufacturing and science jobs':
                                                conv['payload'][key]['te'] = v['bonus']
    if genType == '5':
        for key, val in data.items():
            if 'zh' in val['name']:
                if val['published']:
                    if 'marketGroupID' in val:
                        conv['payload'][key] = val['name']['zh']


# blueprints
if fileName == 'blueprints':
    if genType == '1':
        for key, val in data.items():
            # print(val['activities'])
            if 'manufacturing' in val['activities']:
                if 'products' in val['activities']['manufacturing']:
                    if 'materials' in val['activities']['manufacturing']:
                        # print(val['activities']['manufacturing']['products'][0]['typeID'])
                        # print(val['activities']['manufacturing'])
                        conv['payload'][val['activities']['manufacturing']['products'][0]['typeID']] = {}
                        conv['payload'][val['activities']['manufacturing']['products'][0]['typeID']]['bp'] = key
                        conv['payload'][val['activities']['manufacturing']['products'][0]['typeID']]['mt'] = \
                            val['activities']['manufacturing']['materials']
                        conv['payload'][val['activities']['manufacturing']['products'][0]['typeID']]['pq'] = \
                            val['activities']['manufacturing']['products'][0]['quantity']
    if genType == '2':
        for key, val in data.items():
            if 'reaction' in val['activities']:
                if 'products' in val['activities']['reaction']:
                    if 'materials' in val['activities']['reaction']:
                        conv['payload'][val['activities']['reaction']['products'][0]['typeID']] = {}
                        conv['payload'][val['activities']['reaction']['products'][0]['typeID']]['bp'] = key
                        conv['payload'][val['activities']['reaction']['products'][0]['typeID']]['mt'] = \
                            val['activities']['reaction']['materials']
                        conv['payload'][val['activities']['reaction']['products'][0]['typeID']]['pq'] = \
                            val['activities']['reaction']['products'][0]['quantity']
    if genType == '3':
        for key, val in data.items():
            # print(val['activities'])
            if 'manufacturing' in val['activities']:
                if 'products' in val['activities']['manufacturing']:
                    if 'materials' in val['activities']['manufacturing']:
                        # print(val['activities']['manufacturing']['products'][0]['typeID'])
                        # print(val['activities']['manufacturing'])
                        conv['payload'][val['activities']['manufacturing']['products'][0]['typeID']] = {}
                        conv['payload'][val['activities']['manufacturing']['products'][0]['typeID']]['bp'] = key
                        conv['payload'][val['activities']['manufacturing']['products'][0]['typeID']]['mt'] = \
                            val['activities']['manufacturing']['materials']
                        conv['payload'][val['activities']['manufacturing']['products'][0]['typeID']]['pq'] = \
                            val['activities']['manufacturing']['products'][0]['quantity']
                        conv['payload'][val['activities']['manufacturing']['products'][0]['typeID']]['type'] = 'manufacture'
            if 'reaction' in val['activities']:
                if 'products' in val['activities']['reaction']:
                    if 'materials' in val['activities']['reaction']:
                        conv['payload'][val['activities']['reaction']['products'][0]['typeID']] = {}
                        conv['payload'][val['activities']['reaction']['products'][0]['typeID']]['bp'] = key
                        conv['payload'][val['activities']['reaction']['products'][0]['typeID']]['mt'] = \
                            val['activities']['reaction']['materials']
                        conv['payload'][val['activities']['reaction']['products'][0]['typeID']]['pq'] = \
                            val['activities']['reaction']['products'][0]['quantity']
                        conv['payload'][val['activities']['reaction']['products'][0]['typeID']]['type'] = 'react'


outPut.write(json.dumps(conv, ensure_ascii=False))
outPut.close()