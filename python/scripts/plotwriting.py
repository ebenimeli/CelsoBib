import pandas as pd
data = pd.read_csv('data/writing.txt',sep='\s+',header=None)
data = pd.DataFrame(data)

import matplotlib.pyplot as plt
x = data[0]
y = data[1]
z = data[2]
plt.bar(x,z);
plt.plot(x, y,'r--')

plt.xlabel("días");
plt.ylabel("palabras");


plt.savefig('figures/writing.png')
#plt.show();
